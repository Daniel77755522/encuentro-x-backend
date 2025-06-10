const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Referencia a tu modelo de Usuario
            required: true,
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat', // Referencia a tu modelo de Chat/Conversation
            required: true,
        },
        content: {
            type: String,
            trim: true,
            required: true,
        },
    },
    {
        timestamps: true, // Añade `createdAt` y `updatedAt` automáticamente
    }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;