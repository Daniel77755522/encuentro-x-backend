const asyncHandler = require('express-async-handler'); // Para manejar errores asíncronos sin try/catch
const Post = require('../models/Post'); // Importa el modelo de Post
const User = require('../models/User'); // Necesitamos el modelo de Usuario para verificar el autor

// Función de utilidad para manejar el populate y el filtrado
// Esto ayuda a evitar la repetición de código
const getPopulatedPosts = async (query = {}, userId = null) => {
    // Construye el query: si se pasa userId, busca por ese usuario
    const findQuery = userId ? { user: userId } : query;

    const posts = await Post.find(findQuery)
                            .sort({ createdAt: -1 })
                            .populate('user', 'username email profilePicture'); // Incluye profilePicture si lo usas

    // Filtrar posts donde el campo 'user' se haya convertido en null después del populate
    // Esto significa que el usuario original del post fue eliminado.
    const filteredPosts = posts.filter(post => post.user !== null);

    return filteredPosts;
};


// @desc    Crear una nueva publicación
// @route   POST /api/posts
// @access  Privado (requiere autenticación)
const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        res.status(400);
        throw new Error('Por favor, añade contenido a tu publicación.');
    }

    // El ID del usuario creador viene del middleware de autenticación (req.user.id)
    const post = await Post.create({
        content,
        user: req.user.id, // Asigna el ID del usuario autenticado al post
    });

    // Opcional: Popular el campo 'user' para devolver información del usuario al frontend
    // Usamos el mismo método de popular y filtrar por si acaso (aunque en la creación no debería haber 'null')
    const populatedPost = await getPopulatedPosts({ _id: post._id }); // Pasamos un query para encontrar el post recién creado

    // getPopulatedPosts devuelve un array, tomamos el primer (y único) elemento
    if (populatedPost && populatedPost.length > 0) {
        res.status(201).json(populatedPost[0]); // 201 Created
    } else {
        // En un caso muy raro, si el post se creó pero no se pudo popular/filtrar, manejar el error.
        res.status(500).json({ message: 'Error al procesar la publicación creada.' });
    }
});

// @desc    Obtener todas las publicaciones
// @route   GET /api/posts
// @access  Público (cualquiera puede ver los posts)
const getPosts = asyncHandler(async (req, res) => {
    const posts = await getPopulatedPosts(); // Usa la función de utilidad sin query específico
    res.status(200).json(posts);
});

// @desc    Obtener publicaciones de un usuario específico
// @route   GET /api/posts/user/:userId
// @access  Público
const getUserPosts = asyncHandler(async (req, res) => {
    const userPosts = await getPopulatedPosts({}, req.params.userId); // Usa la función de utilidad con userId

    // Después de filtrar, si el array está vacío, significa que no hay posts válidos para ese usuario.
    if (!userPosts || userPosts.length === 0) {
        res.status(404);
        throw new Error('No se encontraron publicaciones para este usuario o el usuario asociado fue eliminado.');
    }

    res.status(200).json(userPosts);
});


// @desc    Actualizar una publicación
// @route   PUT /api/posts/:id
// @access  Privado (solo el autor puede actualizar)
const updatePost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Publicación no encontrada.');
    }

    // Asegurarse de que el usuario que actualiza es el dueño de la publicación
    // req.user.id viene del token, post.user es el ObjectId del autor en la DB
    if (post.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para actualizar esta publicación.');
    }

    post.content = content || post.content; // Si content está vacío, mantiene el existente
    const updatedPost = await post.save();

    // Volvemos a popular el post actualizado antes de enviarlo
    const populatedUpdatedPost = await getPopulatedPosts({ _id: updatedPost._id });

    if (populatedUpdatedPost && populatedUpdatedPost.length > 0) {
        res.status(200).json(populatedUpdatedPost[0]);
    } else {
        res.status(500).json({ message: 'Error al procesar la publicación actualizada.' });
    }
});

// @desc    Eliminar una publicación
// @route   DELETE /api/posts/:id
// @access  Privado (solo el autor puede eliminar)
const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Publicación no encontrada.');
    }

    // Asegurarse de que el usuario que elimina es el dueño de la publicación
    if (post.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para eliminar esta publicación.');
    }

    await Post.deleteOne({ _id: req.params.id }); // Mongoose 6+ usa deleteOne o deleteMany
    res.status(200).json({ message: 'Publicación eliminada correctamente.' });
});


module.exports = {
    createPost,
    getPosts,
    getUserPosts,
    updatePost,
    deletePost,
};