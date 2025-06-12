require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // <-- ¡NUEVO! Importa jsonwebtoken

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const User = require('./models/User'); // <-- ¡NUEVO! Importa tu modelo de User

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Conexión a MongoDB Atlas
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Conectado a MongoDB Atlas con éxito.');
    })
    .catch(err => {
        console.error('Error al conectar a MongoDB Atlas:', err.message);
    });

// --- Middleware para Express ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Conecta tus rutas REST a la aplicación Express ---
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Backend de MiRedSocial funcionando y conectado!');
});

// --- Configuración e Inicialización de Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://encuentro-x-frontend.onrender.com", // Reemplaza con la URL de tu frontend
        methods: ["GET", "POST"]
    }
});

// --- Middleware de autenticación para Socket.IO (¡NUEVO!) ---
io.use(async (socket, next) => {
    // El token JWT se envía desde el cliente en 'socket.handshake.auth.token'
    const token = socket.handshake.auth.token;

    if (token) {
        try {
            // Verifica el token usando tu JWT_SECRET (de tu .env)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Busca el usuario en la base de datos
            const user = await User.findById(decoded.id).select('-password'); // No necesitas la contraseña

            if (user) {
                // Adjunta el ID y nombre de usuario al objeto socket para futuras referencias
                socket.userId = user._id.toString(); // Guarda el ID como string
                socket.username = user.username;
                next(); // Permite que la conexión continúe
            } else {
                // Si el usuario no se encuentra, rechaza la conexión
                next(new Error('Autenticación fallida: Usuario no encontrado.'));
            }
        } catch (error) {
            console.error('Error de autenticación WebSocket (Token inválido o expirado):', error.message);
            next(new Error('Autenticación fallida: Token inválido.'));
        }
    } else {
        // Si no hay token, rechaza la conexión
        next(new Error('Autenticación fallida: Token no proporcionado.'));
    }
});
// --- FIN Middleware de autenticación para Socket.IO ---


// 3. Define la lógica de eventos de Socket.IO (MODIFICADO)
io.on('connection', (socket) => {
    // Ahora, socket.userId y socket.username estarán disponibles aquí
    console.log(`Usuario conectado por WebSocket: ${socket.id} (User ID: ${socket.userId}, Username: ${socket.username})`);

    // Evento para unirse a una sala de chat (si es un chat mundial, podrías unirlos a una sala fija)
    socket.on('join_chat', (chatId) => {
        // Para un chat mundial, 'chatId' podría ser un ID fijo como 'global_chat_room'
        socket.join(chatId);
        console.log(`Usuario ${socket.username} (${socket.userId}) se unió a la sala: ${chatId}`);
    });

    // Evento para recibir mensajes de texto de los clientes (¡MODIFICADO PARA FILTRADO!)
    socket.on('sendMessage', async (data) => {
        const { chatId, content } = data; // Datos esperados del cliente
        const senderId = socket.userId; // El ID del remitente viene del socket (autenticado)
        const senderUsername = socket.username; // El nombre del remitente viene del socket

        if (!senderId || !content || !chatId) {
            console.warn('Mensaje incompleto o remitente no identificado. Data:', data);
            return;
        }

        // --- PREPARAR EL MENSAJE PARA EMITIR ---
        // (Opcional: Guarda el mensaje en tu base de datos aquí si gestionas historial de mensajes)
        // const Message = require('./models/Message'); // Si tienes un modelo de mensaje
        // const savedMessage = await Message.create({ sender: senderId, chat: chatId, content: content });
        // const messageToEmit = { ...savedMessage.toObject(), sender: { _id: senderId, username: senderUsername }};

        // Si no guardas en DB aquí, crea un objeto simple para emitir:
        const messageToEmit = {
            _id: new mongoose.Types.ObjectId(), // Genera un ID temporal si no viene de la DB
            sender: {
                _id: senderId,
                username: senderUsername // Asegúrate de que el username se pase
            },
            content,
            chat: chatId,
            createdAt: new Date().toISOString() // Fecha y hora del mensaje
        };
        // --- FIN PREPARACIÓN DEL MENSAJE ---


        // Obtener todos los sockets/clientes conectados a la sala específica (ej. 'global_chat_room')
        const socketsInRoom = await io.in(chatId).fetchSockets();

        // Iterar sobre cada destinatario potencial para aplicar el filtro de bloqueo
        for (const recipientSocket of socketsInRoom) {
            const recipientId = recipientSocket.userId;

            // Si el remitente es el propio receptor, siempre le enviamos su mensaje
            if (senderId.toString() === recipientId.toString()) {
                recipientSocket.emit('receiveMessage', messageToEmit);
                continue; // Pasa al siguiente socket
            }

            // Obtener el usuario receptor de la base de datos para ver su lista de bloqueados
            // Selecciona solo el campo 'blockedUsers' para eficiencia
            const recipientUser = await User.findById(recipientId).select('blockedUsers');

            // Verificar si el remitente está en la lista de 'blockedUsers' del receptor
            const isBlocked = recipientUser && recipientUser.blockedUsers.includes(senderId);

            if (!isBlocked) {
                // Si el remitente NO está bloqueado por el receptor, envía el mensaje
                recipientSocket.emit('receiveMessage', messageToEmit);
            } else {
                console.log(`Mensaje de ${senderUsername} (${senderId}) bloqueado para ${recipientSocket.username} (${recipientId}) en ${chatId}`);
            }
        }
    });

    // Evento cuando un cliente se desconecta
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado de WebSocket: ${socket.id} (User ID: ${socket.userId || 'N/A'})`);
    });
});


// --- ¡Importante! Usa `server.listen` en lugar de `app.listen` ---
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Accede a tu backend en: http://localhost:${PORT}`);
});
