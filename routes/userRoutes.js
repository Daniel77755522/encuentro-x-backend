const express = require('express');
const router = express.Router(); // Crea un enrutador Express

// Importa los controladores de usuario
const { registerUser, loginUser } = require('../controllers/userController');

// Importa el middleware de autenticación
const { protect } = require('../middleware/authMiddleware'); // <--- ¡Asegúrate de que esta línea esté presente!

// RUTAS PÚBLICAS (no requieren autenticación)
// Ruta para el registro de un nuevo usuario
// POST /api/users/register
router.post('/register', registerUser);

// Ruta para el inicio de sesión de un usuario
// POST /api/users/login
router.post('/login', loginUser);

// RUTAS PROTEGIDAS (requieren autenticación)
// Ruta protegida de prueba para obtener el perfil del usuario autenticado
// GET /api/users/profile
// El middleware 'protect' se ejecuta antes de la función de la ruta
router.get('/me', protect, (req, res) => {
    // Si la petición llega aquí, significa que el middleware 'protect' ha validado el token
    // y ha adjuntado la información del usuario autenticado a 'req.user'
    res.status(200).json({
        message: 'Acceso al perfil exitoso. ¡Estás autenticado!',
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
        },
    });
});

module.exports = router;