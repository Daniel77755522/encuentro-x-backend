const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, // Este campo hará referencia a un usuario
            ref: 'User',                         // Indica que la referencia es al modelo 'User'
            required: true,
        },
        content: {
            type: String,
            required: [true, 'El contenido de la publicación no puede estar vacío.'], // Mensaje de error personalizado
            trim: true,
            maxlength: [500, 'La publicación no puede exceder los 500 caracteres.'], // Puedes añadir un mensaje aquí también
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Array de IDs de usuarios que le dieron "me gusta"
            },
        ],
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                text: {
                    type: String,
                    required: [true, 'El comentario no puede estar vacío.'],
                    trim: true,
                    maxlength: [200, 'El comentario no puede exceder los 200 caracteres.'],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // createdAt ya no es necesario aquí si usas timestamps: true
    },
    {
        timestamps: true, // <-- ¡Añade esta opción! Mongoose creará 'createdAt' y 'updatedAt' automáticamente
    }
);

// Crea el modelo a partir del esquema
const Post = mongoose.model('Post', postSchema);

module.exports = Post; // Exporta el modelo