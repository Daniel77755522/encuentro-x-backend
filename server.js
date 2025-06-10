require('dotenv').config(); // Asegúrate de que esto esté en la primera línea para cargar las variables de entorno

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // <-- ¡Nuevo: Importa el módulo HTTP de Node.js!
const { Server } = require('socket.io'); // <-- ¡Nuevo: Importa la clase Server de Socket.IO!

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
// const messageRoutes = require('./routes/messageRoutes'); // <-- Descomenta si creas rutas REST para mensajes/chats

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
app.use(cors()); // Permite peticiones de tu frontend
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las peticiones
app.use(express.urlencoded({ extended: false })); // Habilita el parsing de datos de formularios URL-encoded

// --- Conecta tus rutas REST a la aplicación Express ---
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/messages', messageRoutes); // Descomenta si creas rutas REST para mensajes/chats

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Backend de MiRedSocial funcionando y conectado!');
});

// --- Configuración e Inicialización de Socket.IO ---

// 1. Crea un servidor HTTP a partir de tu aplicación Express
const server = http.createServer(app);

// 2. Configura Socket.IO para que escuche en este servidor HTTP
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Permite conexiones WebSocket desde tu frontend de React
        methods: ["GET", "POST"] // Métodos HTTP permitidos para la conexión (para el "handshake")
    }
});

// 3. Define la lógica de eventos de Socket.IO
io.on('connection', (socket) => {
    console.log(`Usuario conectado por WebSocket: ${socket.id}`);

    // Evento para unirse a una sala de chat (esencial para chats entre usuarios)
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`Usuario ${socket.id} se unió a la sala: ${chatId}`);
    });

    // Evento para recibir mensajes de texto de los clientes
    socket.on('sendMessage', (data) => {
        console.log('Mensaje recibido vía WebSocket:', data);
        // TODO: Aquí deberías guardar 'data' (senderId, chatId, content) en MongoDB
        // Después de guardar, emite el mensaje a todos los usuarios en la sala de chat
        io.to(data.chatId).emit('receiveMessage', data);
    });

    // Evento cuando un cliente se desconecta
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado de WebSocket: ${socket.id}`);
    });
});


// --- ¡Importante! Usa `server.listen` en lugar de `app.listen` ---
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Accede a tu backend en: http://localhost:${PORT}`);
});

