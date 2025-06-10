const asyncHandler = require('express-async-handler');
const User = require('../models/User');
// const bcrypt = require('bcryptjs'); // <-- Puedes comentar o eliminar esta línea si no usas bcrypt en otra parte de este archivo
const jwt = require('jsonwebtoken');

// Función para generar JWT (JSON Web Token)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    console.log('--- Petición de registro recibida ---');
    console.log('Cuerpo de la petición (req.body):', req.body);

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Por favor, introduce todos los campos: nombre de usuario, email y contraseña.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400);
        throw new Error('El formato del email no es válido.');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        res.status(400);
        if (userExists.email === email) {
            throw new Error('El email ya está registrado. Por favor, usa otro.');
        } else {
            throw new Error('El nombre de usuario ya está en uso. Por favor, elige otro.');
        }
    }

    // --- ESTAS SON LAS LÍNEAS QUE DEBES QUITAR ---
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    // console.log('Contraseña hasheada (generada para DB):', hashedPassword); // Este log ya no es necesario aquí

    // --- NUEVO console.log para ver la contraseña antes de pasarla al modelo ---
    console.log('Contraseña recibida (texto plano) antes de pasar al modelo:', password);


    // Aquí pasas la contraseña EN TEXTO PLANO.
    // Tu modelo User.js (con el hook pre('save')) se encargará de hashearla antes de guardarla.
    const user = await User.create({
        username,
        // Asegúrate de que el email se guarda en minúsculas si así lo quieres en el esquema
        // (tu esquema ya tiene lowercase: true, así que no es estrictamente necesario aquí,
        // pero es buena práctica si la lógica de minúsculas no estuviera en el modelo)
        email: email.toLowerCase(),
        password: password, // <--- ¡Pasa la contraseña en texto plano aquí!
    });

    if (user) {
        // --- NUEVO console.log para ver el hash FINAL que se ha guardado ---
        console.log('Usuario registrado exitosamente en DB:', user.email);
        console.log('Hash de contraseña FINAL guardado en DB (desde user.password):', user.password);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } else {
        res.status(400);
        throw new Error('Datos de usuario inválidos. No se pudo crear el usuario.');
    }
});

// @desc    Autenticar un usuario e iniciar sesión
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    console.log('\n--- Intentando iniciar sesión ---');
    console.log('Email recibido del frontend para login:', email);
    console.log('Contraseña recibida del frontend para login (texto plano):', password);

    if (!email || !password) {
        res.status(400);
        throw new Error('Por favor, introduce el email y la contraseña.');
    }

    // Encuentra al usuario por email
    const user = await User.findOne({ email: email.toLowerCase() }); // Asegúrate de buscar con email en minúsculas

    if (!user) {
        console.log('Usuario NO encontrado en la base de datos con ese email.');
        res.status(400);
        throw new new Error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    }

    console.log('Usuario ENCONTRADO en la base de datos:', user.email);
    console.log('Contraseña hasheada del usuario en DB (recuperada de la DB):', user.password);

    // Compara la contraseña ingresada con la hasheada en la base de datos
    // Usa el método matchPassword del modelo (es más limpio)
    const isMatch = await user.matchPassword(password); // <--- Usando el método del modelo

    console.log('Resultado de user.matchPassword (isMatch):', isMatch);

    if (!isMatch) {
        console.log('La comparación de contraseñas FALLÓ.');
        res.status(400);
        throw new Error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    }

    // Si la contraseña es correcta, generar el token JWT
    console.log('La comparación de contraseñas fue EXITOSA. Generando token...');
    res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token: generateToken(user._id),
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
});

// @desc    Obtener datos del usuario
// @route   GET /api/users/me
// @access  Privado
const getMe = asyncHandler(async (req, res) => {
    // req.user es adjuntado por el middleware 'protect'.
    // Contiene la información del usuario autenticado que viene del token.
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    res.status(200).json({
        id: user._id,
        username: user.username,
        email: user.email,
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
