const mongoose = require('mongoose'); // Importa Mongoose, la librería para interactuar con MongoDB
const bcrypt = require('bcryptjs');   // Importa bcryptjs para la encriptación de contraseñas

// --- 1. Define el Esquema (Estructura) del Usuario ---
// Un esquema en Mongoose define la forma de los documentos dentro de una colección
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,    // El nombre de usuario es obligatorio
        unique: true,      // Cada nombre de usuario debe ser único
        trim: true         // Elimina espacios en blanco al inicio y final
    },
    email: {
        type: String,
        required: true,    // El email es obligatorio
        unique: true,      // Cada email debe ser único
        trim: true,
        lowercase: true    // Convierte el email a minúsculas para consistencia
    },
    password: {
        type: String,
        required: true     // La contraseña es obligatoria
    },
    // Puedes añadir más campos según las necesidades de tu red social:
    // profilePicture: { type: String, default: 'default.jpg' }, // URL a la imagen de perfil
    // bio: { type: String, trim: true, maxlength: 200 },        // Biografía corta
    createdAt: {
        type: Date,
        default: Date.now  // Fecha de creación del usuario, por defecto la fecha actual
    }
});

// --- 2. Middleware de Mongoose: Encriptar la Contraseña Antes de Guardar ---
// Este es un 'hook' que se ejecuta ANTES de que un documento sea guardado ('save')
userSchema.pre('save', async function(next) {
    // Solo hasheamos la contraseña si ha sido modificada o si es un documento nuevo
    // Esto evita re-hashear una contraseña ya hasheada si el documento se actualiza
    if (!this.isModified('password')) {
        return next(); // Si la contraseña no se ha modificado, pasa al siguiente middleware
    }

    try {
        // Genera un 'salt' (valor aleatorio) para añadir seguridad al hasheo
        // '10' es el número de rondas de hasheo (costo): mayor número = más seguro, pero más lento
        const salt = await bcrypt.genSalt(10);

        // Hashea (encripta) la contraseña usando el salt generado
        this.password = await bcrypt.hash(this.password, salt);
        next(); // Continúa con el proceso de guardado
    } catch (error) {
        // Si ocurre un error durante el hasheo, pásalo al siguiente middleware de error
        next(error);
    }
});

// --- 3. Método Personalizado para Comparar Contraseñas ---
// Este método se añade al esquema y se usará para verificar la contraseña
// que un usuario ingresa durante el inicio de sesión contra la hasheada en la DB.
userSchema.methods.matchPassword = async function(enteredPassword) {
    // 'bcrypt.compare' compara una contraseña en texto plano con un hash existente
    // Retorna true si coinciden, false si no.
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- 4. Crea y Exporta el Modelo de Usuario ---
// 'User' será el nombre de tu colección en MongoDB (en minúsculas y plural: 'users')
const User = mongoose.model('User', userSchema);

module.exports = User; // Exporta el modelo para que pueda ser utilizado en otros archivos (ej. controladores)