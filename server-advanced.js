const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 1e7, // ~10MB - voice messages (base64 audio) are much larger than text
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============= LOGGING UTILITIES =============
const logger = {
  log: (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, data);
  },
  info: (message, data) => logger.log('INFO', message, data),
  warn: (message, data) => logger.log('WARN', message, data),
  error: (message, data) => logger.log('ERROR', message, data),
};

// ============= DATA STRUCTURES =============
const rooms = new Map();
const userProfiles = new Map();
const roomMessages = new Map();
const connectionStats = new Map();

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.participants = [];
    this.createdAt = new Date();
    this.messages = [];
    this.isActive = true;
  }

  addParticipant(socketId) {
    const participant = {
      socketId,
      joinedAt: new Date(),
      status: 'active'
    };
    this.participants.push(participant);
    return participant;
  }

  removeParticipant(socketId) {
    this.participants = this.participants.filter(p => p.socketId !== socketId);
  }

  addMessage(socketId, message, type = 'text', extra = {}) {
    this.messages.push({
      socketId,
      message,
      type,
      ...extra,
      timestamp: new Date()
    });
    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages.shift();
    }
  }

  getParticipantCount() {
    return this.participants.length;
  }
}

// ============= ROUTES =============
app.get('/', (req, res) => {
  res.json({
    message: 'Anonymous Chat Server',
    status: 'running',
    timestamp: new Date(),
    rooms: rooms.size,
    stats: getServerStats()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalRooms: rooms.size,
    totalUsers: connectionStats.size,
    roomsList: Array.from(rooms.entries()).map(([id, room]) => ({
      roomId: id,
      participants: room.getParticipantCount(),
      createdAt: room.createdAt,
      messageCount: room.messages.length
    }))
  });
});

app.post('/api/room/create', (req, res) => {
  const roomId = 'room-' + Math.random().toString(36).substr(2, 9);
  const room = new Room(roomId);
  rooms.set(roomId, room);
  
  logger.info('Room created', { roomId });
  res.json({ roomId, createdAt: room.createdAt });
});

app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    roomId: room.roomId,
    participants: room.getParticipantCount(),
    createdAt: room.createdAt,
    isActive: room.isActive,
    messageCount: room.messages.length
  });
});

// ============= SOCKET.IO EVENTS =============
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });
  connectionStats.set(socket.id, { connectedAt: new Date() });

  // Join room
  socket.on('join-room', (data) => {
    const { roomId } = data;

    try {
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        const newRoom = new Room(roomId);
        rooms.set(roomId, newRoom);
        logger.info('New room created on join', { roomId });
      }

      const room = rooms.get(roomId);
      socket.join(roomId);
      room.addParticipant(socket.id);

      socket.currentRoom = roomId;

      logger.info('User joined room', {
        socketId: socket.id,
        roomId,
        participantCount: room.getParticipantCount()
      });

      // Broadcast to room
      io.to(roomId).emit('participant-count', room.getParticipantCount());
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        participantCount: room.getParticipantCount(),
        timestamp: new Date()
      });

      // Send existing messages to new user
      if (room.messages.length > 0) {
        socket.emit('history', { messages: room.messages });
      }

    } catch (err) {
      logger.error('Error joining room', { roomId, error: err.message });
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  // Voice Message (recorded audio as base64 data URL)
  socket.on('voice-message', (data) => {
    const { roomId, audio, duration } = data || {};

    try {
      if (!roomId || !rooms.has(roomId)) {
        throw new Error('Room not found: ' + roomId);
      }
      if (!audio) return;

      const room = rooms.get(roomId);
      room.addMessage(socket.id, '[voice message]', 'voice', { audio, duration: duration || 0 });

      logger.info('Voice message sent', { socketId: socket.id, roomId, duration: duration || 0 });

      socket.to(roomId).emit('voice-message', {
        audio,
        duration: duration || 0,
        senderId: socket.id,
        timestamp: new Date(),
        roomId
      });

    } catch (err) {
      logger.error('Error sending voice message', { error: err.message });
      socket.emit('error', { message: 'Error sending voice message' });
    }
  });

  // Chat Message
  socket.on('chat-message', (data) => {
    const { roomId, message } = data;

    try {
      if (!rooms.has(roomId)) {
        throw new Error('Room not found');
      }
      if (!message || !message.trim()) return;

      const room = rooms.get(roomId);
      room.addMessage(socket.id, message, 'text');

      logger.info('Message sent', { socketId: socket.id, roomId, messageLength: message.length });

      socket.to(roomId).emit('chat-message', {
        message,
        senderId: socket.id,
        timestamp: new Date(),
        roomId
      });

    } catch (err) {
      logger.error('Error sending message', { error: err.message });
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('typing');
  });

  socket.on('stopped-typing', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('stopped-typing');
  });

  // User disconnect
  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id });

    if (socket.currentRoom) {
      const room = rooms.get(socket.currentRoom);

      if (room) {
        room.removeParticipant(socket.id);

        logger.info('User left room', {
          socketId: socket.id,
          roomId: socket.currentRoom,
          participantCount: room.getParticipantCount()
        });

        // Notify remaining users
        io.to(socket.currentRoom).emit('user-left', {
          userId: socket.id,
          participantCount: room.getParticipantCount(),
          timestamp: new Date()
        });

        io.to(socket.currentRoom).emit('participant-count', room.getParticipantCount());

        // Delete room if empty after 5 minutes
        if (room.getParticipantCount() === 0) {
          setTimeout(() => {
            if (room.getParticipantCount() === 0) {
              rooms.delete(socket.currentRoom);
              logger.info('Empty room deleted', { roomId: socket.currentRoom });
            }
          }, 5 * 60 * 1000);
        }
      }
    }

    connectionStats.delete(socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error('Socket error', { socketId: socket.id, error });
  });
});

// ============= UTILITY FUNCTIONS =============
function getServerStats() {
  let totalParticipants = 0;
  rooms.forEach(room => {
    totalParticipants += room.getParticipantCount();
  });

  return {
    uptime: process.uptime(),
    totalRooms: rooms.size,
    totalConnections: connectionStats.size,
    totalParticipants: totalParticipants,
    memory: process.memoryUsage()
  };
}

// ============= SCHEDULED CLEANUP =============
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let cleaned = 0;

  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > maxAge && room.getParticipantCount() === 0) {
      rooms.delete(roomId);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    logger.info('Cleanup task completed', { roomsCleaned: cleaned });
  }
}, 60 * 60 * 1000); // Every hour

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// ============= START SERVER =============
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
  
  console.log(`
╔════════════════════════════════════╗
║   Anonymous Chat Server v2.0       ║
║   Running on port ${PORT}            ║
║   ${process.env.NODE_ENV || 'Development'}                    ║
╚════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
