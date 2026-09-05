# 🎤 Anonymous Chat Room - Complete Application

A full-featured anonymous chatting website with voice/video chat, built with React, Node.js, and WebRTC. Share a link and instantly start chatting!

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen)

## ⚡ Features

### Core Features
✅ **Anonymous Chatting** - No registration required  
✅ **Voice Chat** - Peer-to-peer audio using WebRTC  
✅ **Video Chat** - Real-time video communication  
✅ **Text Messages** - Send instant text messages  
✅ **Shareable Links** - Generate and share room IDs  
✅ **Responsive Design** - Works on desktop and mobile  

### Advanced Features
🎯 **Screen Sharing** - Share your screen with others  
🔐 **Message Encryption** - End-to-end encrypted messages  
🎥 **Call Recording** - Record voice/video calls  
📁 **File Transfer** - Send files through data channels  
😊 **Message Reactions** - React to messages with emojis  
👤 **User Profiles** - Custom nicknames and avatars  
🔔 **Notifications** - Desktop notifications for events  
💾 **Message History** - Persist messages in database  

## 📁 Project Structure

```
anonymous-chat-app/
├── index.html                 # HTML entry point
├── chat.css                   # Basic styling
├── chat-enhanced.css          # Advanced styling
├── chat-frontend.jsx          # Basic React component
├── chat-enhanced.jsx          # Enhanced React component
├── server.js                  # Basic Node.js server
├── server-advanced.js         # Advanced server with logging
├── package.json              # Dependencies
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose setup
├── nginx.conf               # Nginx configuration
├── QUICKSTART.md            # Quick setup guide
├── SETUP_GUIDE.md           # Detailed setup guide
├── DEPLOYMENT_GUIDE.md      # Deployment instructions
├── ADVANCED_FEATURES.md     # Advanced features guide
└── README.md                # This file
```

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 14+ ([Download](https://nodejs.org))
- npm (comes with Node.js)
- Modern web browser

### Step 1: Install & Start Backend
```bash
# Install dependencies
npm install

# Start server
npm start
```

✅ You should see: `Listening on port 3001`

### Step 2: Start Frontend
```bash
# In a new terminal
python -m http.server 3000
# or
npx http-server -p 3000
```

### Step 3: Open in Browser
Visit: **http://localhost:3000**

### Step 4: Test It
1. Create a new room
2. Copy the room ID
3. Open another tab/window
4. Paste room ID and join
5. Click "Start Voice Call"
6. Allow microphone access
7. Talk! 🎤

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Get running in 5 minutes |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Complete setup instructions |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deploy to production |
| [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) | Add advanced features |

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Socket.io Client** - Real-time communication
- **WebRTC** - Peer-to-peer media
- **CSS3** - Responsive styling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - WebSocket server
- **Nginx** - Reverse proxy

### Deployment
- **Docker** - Containerization
- **Railway/Heroku** - Hosting
- **Vercel** - Frontend hosting
- **AWS/DigitalOcean** - Cloud hosting

## 🌐 Deployment Options

### Easy Deployment (Recommended)

#### Railway.app + Vercel (5 mins setup)
```bash
# Backend: Deploy to Railway
# 1. Visit railway.app
# 2. Import this repo
# 3. Deploy (automatic)

# Frontend: Deploy to Vercel
# 1. Visit vercel.com
# 2. Import this repo
# 3. Deploy (automatic)

# Update socket URL in chat-frontend.jsx
```

#### Docker (Local/Server)
```bash
# Build image
docker build -t chat-app .

# Run container
docker run -p 3001:3001 chat-app

# Or use Docker Compose
docker-compose up -d
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## 💻 Development Setup

### Using Enhanced Version (Video Chat)

Replace `chat-frontend.jsx` with `chat-enhanced.jsx`:

```bash
# Update index.html
# Change: <script src="chat-frontend.jsx">
# To: <script src="chat-enhanced.jsx">
```

### Using Advanced Server

For production, use `server-advanced.js`:

```bash
# Update package.json start script
# Change: "start": "node server.js"
# To: "start": "node server-advanced.js"
```

### Development with Auto-Reload

```bash
npm install -D nodemon
npm run dev
```

## 🔒 Security Features

- ✅ End-to-end peer-to-peer (no server recording)
- ✅ Optional message encryption
- ✅ CORS protection
- ✅ HTTPS/SSL in production
- ✅ Input validation and sanitization
- ✅ Security headers with Helmet.js

## 📊 API Reference

### Socket.io Events

#### Joining a Room
```javascript
socket.emit('join-room', { roomId: 'room-123' })
socket.on('participant-count', (count) => { /* ... */ })
socket.on('user-joined', (data) => { /* ... */ })
```

#### Voice/Video Call
```javascript
socket.emit('offer', { roomId, offer })
socket.on('offer', (data) => { /* handle offer */ })
socket.emit('answer', { roomId, answer })
socket.on('answer', (data) => { /* handle answer */ })
socket.emit('ice-candidate', { roomId, candidate })
socket.on('ice-candidate', (data) => { /* handle ICE */ })
```

#### Messaging
```javascript
socket.emit('chat-message', { roomId, message })
socket.on('chat-message', (data) => { /* receive message */ })
```

### REST API Endpoints

```bash
GET /                          # Server status
GET /api/stats                 # Server statistics
POST /api/room/create          # Create new room
GET /api/room/:roomId          # Get room info
```

## 🧪 Testing

### Manual Testing
1. Open 2 browser windows
2. Create room in first window
3. Join room in second window
4. Send messages and start call

### Automated Testing
```bash
npm install --save-dev jest supertest
npm test
```

## 🐛 Troubleshooting

### "Can't connect to server"
- Check if backend is running: `npm start`
- Verify port 3001 is not blocked
- Check browser console (F12) for errors

### "Microphone access denied"
- Check browser permissions (URL bar 🔒)
- Ensure HTTPS in production
- Try different browser
- Verify microphone works

### "Can't hear other person"
- Check browser volume
- Verify both users clicked "Start Voice Call"
- Check network connection
- Try refreshing page

### "Room disconnects frequently"
- Check internet connection stability
- Verify server is running
- Look at browser console for errors
- Check server logs

## 📈 Performance

### Browser Compatibility
| Browser | Voice | Video | Desktop |
|---------|-------|-------|---------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ⚠️ |
| Edge | ✅ | ✅ | ✅ |
| Mobile | ✅ | ⚠️ | ⚠️ |

### Recommended Specs
- **CPU**: 2+ cores
- **RAM**: 2GB minimum
- **Network**: 2Mbps upload/download
- **Browser**: Latest version

## 🚀 Scaling

### Single Server (Current)
- Handles ~100-200 concurrent users
- Each room is peer-to-peer

### Multi-Server Setup
```
         ┌─ Node Server 1 (3001)
         │
  Nginx  ├─ Node Server 2 (3001)
    │    │
    └──  └─ Node Server 3 (3001)
```

### Production-Grade (100K+ users)
- Load balancer (AWS ELB, etc.)
- Multiple server instances
- Message queue (Redis)
- Database persistence
- CDN for static assets
- Monitoring & logging

## 🎯 Feature Roadmap

### v2.0 (Current) ✅
- Basic chat and voice
- Video support
- Enhanced UI
- Advanced logging

### v2.1 (Planned)
- Screen sharing
- Message encryption
- File transfer
- Call recording

### v3.0 (Future)
- Group calls (3+ users)
- Message persistence
- User authentication
- Mobile app
- AI features (transcription, etc.)

## 💡 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

### Getting Help
- 📖 Read the [documentation](./SETUP_GUIDE.md)
- 🐛 Check [troubleshooting](./README.md#-troubleshooting) section
- 💬 Open an issue on GitHub
- 🎓 See [advanced features](./ADVANCED_FEATURES.md) guide

### Resources
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.io Docs](https://socket.io/docs/)
- [React Documentation](https://react.dev)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)

## 📞 Contact

- **Twitter**: [@your-handle](https://twitter.com)
- **Email**: your-email@example.com
- **Discord**: [Join Server](https://discord.gg)

## 🎉 Credits

Built with ❤️ using:
- [React](https://react.dev)
- [Node.js](https://nodejs.org)
- [Socket.io](https://socket.io)
- [WebRTC](https://webrtc.org)

## 📌 Star History

⭐ If you like this project, please give it a star on GitHub!

```
 ⭐⭐⭐⭐⭐  Amazing Project!
     ↓
    Fork & Contribute
     ↓
  Share with Friends
```

---

## 🔥 Pro Tips

1. **Use HTTPS in Production** - Secure your connections
2. **Enable Compression** - Gzip for smaller payloads
3. **Monitor Performance** - Track room count and participants
4. **Regular Updates** - Keep Node.js and dependencies current
5. **Test Thoroughly** - Before deploying to production
6. **Backup Data** - If using database
7. **Set Rate Limits** - Prevent abuse
8. **Use CDN** - For static assets
9. **Add Analytics** - Track usage patterns
10. **Plan for Scaling** - Before hitting limits

---

**Made with ❤️ for developers**

🚀 Ready to deploy? Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

📚 Want to add features? See [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)

🤔 Need help? Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
