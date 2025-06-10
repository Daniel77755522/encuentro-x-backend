const express = require('express');
const router = express.Router();
const {
    createPost,
    getPosts,
    getUserPosts,
    updatePost,
    deletePost,
} = require('../controllers/postController'); // Importa las funciones del controlador
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de protección

// --- Rutas para Publicaciones ---

// @desc    Crear una nueva publicación
// @route   POST /api/posts
// @access  Privado (Solo usuarios autenticados)
router.post('/', protect, createPost); // Aplica 'protect' antes de 'createPost'

// @desc    Obtener todas las publicaciones (feed)
// @route   GET /api/posts
// @access  Público (cualquiera puede ver el feed)
router.get('/', getPosts);

// @desc    Obtener publicaciones de un usuario específico
// @route   GET /api/posts/user/:userId
// @access  Público
router.get('/user/:userId', getUserPosts);

// @desc    Actualizar una publicación
// @route   PUT /api/posts/:id
// @access  Privado (Solo el autor autenticado)
// El orden importa: protect primero, luego updatePost
router.put('/:id', protect, updatePost);

// @desc    Eliminar una publicación
// @route   DELETE /api/posts/:id
// @access  Privado (Solo el autor autenticado)
router.delete('/:id', protect, deletePost);

module.exports = router;