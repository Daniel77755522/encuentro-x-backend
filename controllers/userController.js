const User = require('../models/User'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ** IMPORTANTE: Si tienes un modelo de mensajes o posts que se vincula al usuario, impórtalo aquí **
const Message = require('../models/Message'); // Reemplaza por el nombre de tu modelo de mensajes/posts si es diferente
// const Post = require('../models/Post'); // Si también tienes posts vinculados al usuario

// --- Funciones de Autenticación existentes (Login, Register) ---

// @desc    Registrar nuevo usuario
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El usuario ya existe con este email.' });
        }

        // Crear nuevo usuario con la contraseña en texto plano
        // El hasheo se realizará automáticamente por el middleware pre('save') en el modelo User.js
        user = new User({
            username,
            email,
            password // Pasa la contraseña en texto plano al modelo
        });

        await user.save(); // Dispara el middleware pre('save') en User.js para hashear la contraseña

        // Generar JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Tiempo de expiración: 7 días

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            token
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error del servidor');
    }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // Comparar contraseña
        // El método matchPassword utiliza bcrypt.compare para comparar la contraseña ingresada
        // (que se hashea internamente) con la contraseña hasheada guardada en la base de datos.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // Generar JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Tiempo de expiración: 7 días

        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                // Asegúrate de devolver también 'blockedUsers' si tu modelo User lo tiene
                blockedUsers: user.blockedUsers // Añadir esta línea si el campo existe en tu modelo User
            },
            token
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error del servidor');
    }
};

// @desc    Obtener datos del perfil del usuario (ejemplo, puede no ser necesario si ya tienes el user en el frontend)
// @route   GET /api/users/me
// @access  Private (requiere autenticación)
exports.getMe = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación (que decodifica el JWT)
        const user = await User.findById(req.user.id).select('-password'); // No devolver la contraseña
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error del servidor');
    }
};


// --- NUEVA FUNCIÓN: Eliminar Cuenta de Usuario ---
// @desc    Eliminar la cuenta del usuario autenticado y sus datos asociados
// @route   DELETE /api/users/me
// @access  Private (requiere autenticación)
exports.deleteUserAccount = async (req, res) => {
    try {
        // El ID del usuario se obtiene del token JWT decodificado por el middleware de autenticación
        const userIdToDelete = req.user.id; // Asumiendo que el ID del usuario está en req.user.id

        // 1. **ELIMINAR TODOS LOS DATOS ASOCIADOS AL USUARIO**
        // Este es el paso más CRÍTICO y depende de cómo enlaces los datos en tu base de datos.
        // Asegúrate de que las propiedades coincidan con cómo guardas el ID del remitente.

        // Ejemplo: Eliminar todos los mensajes enviados por este usuario
        // Si tu modelo de Message tiene un campo 'sender' o 'senderId' que guarda el ObjectId del usuario
        if (Message) { // Verifica si Message fue importado
            // Ajusta 'sender' a la propiedad que usas para el ID del remitente en tu modelo Message
            await Message.deleteMany({ sender: userIdToDelete }); 
            console.log(`Mensajes del usuario ${userIdToDelete} eliminados.`);
        }

        // Si tienes otros modelos (ej. Posts, Comments) vinculados al usuario, ELIMÍNALOS TAMBIÉN:
        // if (Post) { await Post.deleteMany({ author: userIdToDelete }); }
        // if (Comment) { await Comment.deleteMany({ author: userIdToDelete }); }
        // ... repite para cualquier otra colección donde el usuario sea "dueño" de datos.

        // 2. Eliminar el usuario de la colección de Usuarios
        const deletedUser = await User.findByIdAndDelete(userIdToDelete);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
        }

        // 3. Respuesta de éxito
        res.status(200).json({ message: 'Cuenta y datos asociados eliminados exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar la cuenta de usuario:', error.message);
        res.status(500).send('Error del servidor al eliminar la cuenta.');
    }
};