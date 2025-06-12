const User = require('../models/User'); // Importa tu modelo de Usuario
// No necesitamos importar un modelo 'Block' separado porque los bloqueos están en el modelo de User

// @desc    Bloquear un usuario
// @route   POST /api/users/block
// @access  Private (requiere autenticación)
exports.blockUser = async (req, res) => {
    try {
        // req.user.id viene de tu authMiddleware, es el ID del usuario que está realizando el bloqueo
        const blockerId = req.user.id;
        // El blockedId es el ID del usuario que se va a bloquear, viene del cuerpo de la solicitud
        const { blockedId } = req.body;

        // 1. Validaciones básicas
        if (!blockedId) {
            return res.status(400).json({ message: 'El ID del usuario a bloquear es requerido.' });
        }

        if (blockerId.toString() === blockedId.toString()) {
            return res.status(400).json({ message: 'No puedes bloquearte a ti mismo.' });
        }

        // 2. Verificar que el usuario a bloquear realmente exista
        const userToBlock = await User.findById(blockedId);
        if (!userToBlock) {
            return res.status(404).json({ message: 'Usuario a bloquear no encontrado.' });
        }

        // 3. Añadir el blockedId al array 'blockedUsers' del usuario que bloquea
        // $addToSet asegura que el ID solo se añada si no existe ya (evita duplicados)
        const updatedUser = await User.findByIdAndUpdate(
            blockerId,
            { $addToSet: { blockedUsers: blockedId } },
            { new: true, runValidators: true } // new: true devuelve el documento actualizado
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario bloqueador no encontrado.' });
        }

        res.status(200).json({ message: 'Usuario bloqueado con éxito.', blockedUsers: updatedUser.blockedUsers });

    } catch (error) {
        console.error('Error al bloquear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al bloquear usuario.' });
    }
};

// @desc    Desbloquear un usuario
// @route   DELETE /api/users/unblock/:blockedId
// @access  Private (requiere autenticación)
exports.unblockUser = async (req, res) => {
    try {
        const blockerId = req.user.id; // El ID del usuario que está desbloqueando
        const { blockedId } = req.params; // El ID del usuario a desbloquear, desde la URL

        // 1. Validaciones básicas
        if (!blockedId) {
            return res.status(400).json({ message: 'El ID del usuario a desbloquear es requerido.' });
        }

        // 2. Eliminar el blockedId del array 'blockedUsers' del usuario que desbloquea
        // $pull elimina el valor especificado del array
        const updatedUser = await User.findByIdAndUpdate(
            blockerId,
            { $pull: { blockedUsers: blockedId } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario desbloqueador no encontrado.' });
        }

        // Opcional: Puedes verificar si el usuario estaba realmente bloqueado para dar una respuesta más específica
        // if (!updatedUser.blockedUsers.includes(blockedId)) {
        //     return res.status(404).json({ message: 'Este usuario no estaba bloqueado.' });
        // }

        res.status(200).json({ message: 'Usuario desbloqueado con éxito.', blockedUsers: updatedUser.blockedUsers });

    } catch (error) {
        console.error('Error al desbloquear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al desbloquear usuario.' });
    }
};

// @desc    Obtener la lista de usuarios que el usuario actual ha bloqueado
// @route   GET /api/users/blocked
// @access  Private (requiere autenticación)
exports.getBlockedUsers = async (req, res) => {
    try {
        const blockerId = req.user.id; // El ID del usuario actual

        // Buscar el usuario y seleccionar solo el campo blockedUsers
        // Usamos .populate() para obtener los detalles de los usuarios bloqueados
        const user = await User.findById(blockerId).select('blockedUsers').populate('blockedUsers', 'username email profilePicture'); // Ajusta 'username email profilePicture' a los campos que quieres mostrar de los usuarios bloqueados

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json(user.blockedUsers);

    } catch (error) {
        console.error('Error al obtener usuarios bloqueados:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios bloqueados.' });
    }
};