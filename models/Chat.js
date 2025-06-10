const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
    {
        chatName: { type: String, trim: true }, // Opcional: para nombres de chats grupales
        isGroupChat: { type: Boolean, default: false }, // true para chats grupales
        users: [ // Los IDs de los participantes del chat
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        latestMessage: { // Para mostrar el último mensaje en la lista de chats del usuario
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        groupAdmin: { // Solo si implementas grupos y necesitas un administrador
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;