const jwt = require('jsonwebtoken'); // Para verificar el token
const User = require('../models/User'); // Para buscar al usuario por el ID del token
const asyncHandler = require('express-async-handler'); // <-- ¡Importa asyncHandler!

const protect = asyncHandler(async (req, res, next) => { // <-- ¡Envuelve la función con asyncHandler!
    let token;

    // 1. Verificar si el token está en las cabeceras de la petición
    // Las peticiones suelen enviar el token en el formato "Bearer TOKEN_AQUI"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extraer el token de la cabecera
            token = req.headers.authorization.split(' ')[1]; // Divide "Bearer TOKEN" y toma el TOKEN

            // 3. Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Buscar al usuario en la base de datos usando el ID del token
            // Seleccionamos todo MENOS la contraseña
            req.user = await User.findById(decoded.id).select('-password');

            // Agregado: Si el usuario no es encontrado con el ID del token
            if (!req.user) {
                res.status(401);
                throw new Error('Usuario asociado al token no encontrado.');
            }

            // 5. Pasar al siguiente middleware o a la ruta
            next();

        } catch (error) {
            console.error('Error en el middleware de autenticación:', error);
            res.status(401); // No autorizado

            // Mensajes de error más específicos para el cliente
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Token no válido o corrupto. Acceso denegado.');
            }
            throw new Error('No autorizado, token fallido.'); // Mensaje genérico para otros errores
        }
    } else { // Si no hay token en las cabeceras (el 'else' es importante aquí)
        res.status(401);
        throw new Error('No autorizado, no hay token.');
    }
});

module.exports = { protect };