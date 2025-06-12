const express = require('express');
const router = express.Router(); // Crea un enrutador Express

// Importa los controladores de usuario
// Asegúrate de que deleteUserAccount esté exportado en userController.js
const { registerUser, loginUser, deleteUserAccount } = require('../controllers/userController'); // <--- AÑADE deleteUserAccount aquí

// Importa el middleware de autenticación
const { protect } = require('../middleware/authMiddleware');

// RUTAS PÚBLICAS (no requieren autenticación)
// Ruta para el registro de un nuevo usuario
// POST /api/users/register
router.post('/register', registerUser);

// Ruta para el inicio de sesión de un usuario
// POST /api/users/login
router.post('/login', loginUser);

// RUTAS PROTEGIDAS (requieren autenticación)

// Ruta protegida para obtener el perfil del usuario autenticado
// GET /api/users/me
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

// --- NUEVA RUTA: Eliminar cuenta de usuario ---
// DELETE /api/users/me
// Esta ruta debe ser protegida con el middleware 'protect'
router.delete('/me', protect, deleteUserAccount); // <--- AÑADE ESTA LÍNEA

module.exports = router;