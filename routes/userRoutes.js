const express = require('express');
const router = express.Router(); // Crea un enrutador Express

// Importa los controladores de usuario
// Asegúrate de que deleteUserAccount esté exportado en userController.js
const { registerUser, loginUser, deleteUserAccount } = require('../controllers/userController');

// Importa el middleware de autenticación
const { protect } = require('../middleware/authMiddleware');

// --- IMPORTA EL NUEVO CONTROLADOR DE BLOQUEO ---
const { blockUser, unblockUser, getBlockedUsers } = require('../controllers/blockController');
// --- FIN IMPORTACIÓN NUEVO CONTROLADOR ---

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
router.delete('/me', protect, deleteUserAccount);

// --- NUEVAS RUTAS PARA EL BLOQUEO (Protegidas) ---
// POST /api/users/block - Para bloquear un usuario
router.post('/block', protect, blockUser);

// DELETE /api/users/unblock/:blockedId - Para desbloquear un usuario
router.delete('/unblock/:blockedId', protect, unblockUser);

// GET /api/users/blocked - Para obtener la lista de usuarios que el usuario actual ha bloqueado
router.get('/blocked', protect, getBlockedUsers);
// --- FIN NUEVAS RUTAS PARA EL BLOQUEO ---


module.exports = router;