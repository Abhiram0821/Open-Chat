const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 1e7, // ~10MB - voice messages (base64 audio) are much larger than text
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Store active rooms and participants
const rooms = new Map();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Anonymous Chat Server running' });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // User joins a room
  socket.on('join-room', (data) => {
    const { roomId } = data;

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: [],
        createdAt: new Date()
      });
    }

    const room = rooms.get(roomId);
    
    // Add user to room
    socket.join(roomId);
    room.participants.push({
      socketId: socket.id,
      joinedAt: new Date()
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${room.participants.length} participants`);

    // Notify all users in room about participant count
    io.to(roomId).emit('participant-count', room.participants.length);

    // Notify others that new user joined
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      participantCount: room.participants.length
    });

    // Store room info in socket for later use
    socket.currentRoom = roomId;
  });

  // Handle voice messages (recorded audio, base64 data URL)
  socket.on('voice-message', (data) => {
    const { roomId, audio, duration } = data || {};
    if (!roomId || !audio) {
      console.log(`Rejected voice message from ${socket.id}: missing roomId/audio`);
      return;
    }

    console.log(`Voice message from ${socket.id} in room ${roomId}: ${duration || 0}s, ${String(audio).length} chars`);

    // Broadcast voice message to all other users in the room
    socket.to(roomId).emit('voice-message', {
      audio: audio,
      duration: duration || 0,
      senderId: socket.id,
      timestamp: new Date(),
      roomId: roomId
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { roomId, message } = data;
    
    // Broadcast message to all users in the room except sender
    socket.to(roomId).emit('chat-message', {
      message: message,
      senderId: socket.id,
      timestamp: new Date(),
      roomId: roomId
    });

    console.log(`Message in room ${roomId}: ${message}`);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from room
    if (socket.currentRoom) {
      const room = rooms.get(socket.currentRoom);
      
      if (room) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id);
        
        // Notify remaining users
        io.to(socket.currentRoom).emit('user-left', {
          userId: socket.id,
          participantCount: room.participants.length
        });

        io.to(socket.currentRoom).emit('participant-count', room.participants.length);

        // Delete room if empty
        if (room.participants.length === 0) {
          rooms.delete(socket.currentRoom);
          console.log(`Room ${socket.currentRoom} deleted (empty)`);
        }
      }
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Cleanup old rooms (optional)
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > maxAge && room.participants.length === 0) {
      rooms.delete(roomId);
      console.log(`Removed old empty room: ${roomId}`);
    }
  });
}, 60 * 60 * 1000); // Check every hour

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   Anonymous Chat Server Running    ║
║   Listening on port ${PORT}          ║
╚════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
