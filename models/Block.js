// models/Block.js
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    blockerId: { // El usuario que realiza el bloqueo
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia a tu modelo de User
        required: true
    },
    blockedId: { // El usuario que es bloqueado
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia a tu modelo de User
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Asegurar que no haya duplicados (un usuario no puede bloquear dos veces al mismo)
blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);