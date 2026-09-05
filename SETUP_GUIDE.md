# Anonymous Chat Room with Voice Chat - Setup Guide

A full-stack anonymous chatting application with WebRTC voice chat capability. Share a link with anyone and start chatting instantly!

## 🚀 Features

- ✅ **Anonymous** - No registration or login required
- 🎤 **Voice Chat** - Real-time peer-to-peer audio communication using WebRTC
- 💬 **Text Chat** - Send messages alongside voice calls
- 🔗 **Easy Sharing** - Generate unique room IDs, copy and share with others
- 📱 **Responsive** - Works on desktop and mobile devices
- 🌐 **Real-time Updates** - Live participant count and connection status

## 📋 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication library
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **WebRTC** - Peer-to-peer voice communication
- **Socket.io Client** - Real-time messaging

## 🔧 Local Setup

### Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- Modern web browser with WebRTC support

### Step 1: Clone/Download the project

```bash
# Create a project folder
mkdir anonymous-chat-app
cd anonymous-chat-app
```

### Step 2: Setup Backend

```bash
# Install dependencies
npm install

# Start the server
npm start
# OR for development with auto-reload:
npm install -D nodemon
npm run dev
```

You should see:
```
╔════════════════════════════════════╗
║   Anonymous Chat Server Running    ║
║   Listening on port 3001           ║
╚════════════════════════════════════╝
```

### Step 3: Setup Frontend

Open `index.html` in your browser:
- **Option 1:** Double-click `index.html` file
- **Option 2:** Use a local server (recommended)
  ```bash
  # In another terminal, in the same directory
  python -m http.server 3000
  # or
  npx http-server -p 3000
  ```
  Then open: `http://localhost:3000`

### Step 4: Test the Application

1. Open the app in your browser
2. Click **"Create New Room"** to generate a unique room ID
3. **Copy the Room ID** (button is provided)
4. Open the app in **another browser/tab** and paste the Room ID
5. Click **"Join Room"**
6. Click **"Start Voice Call"** to initiate voice communication

## 🌐 Deployment

### Deploy Backend (Node.js server)

#### Option 1: Railway.app (Recommended - Free tier available)
```bash
# 1. Sign up at railway.app
# 2. Connect your GitHub repo (or use CLI)
# 3. Railway auto-detects Node.js and deploys
# 4. Get your server URL from Railway dashboard
```

#### Option 2: Heroku
```bash
# 1. Sign up at heroku.com
# 2. Install Heroku CLI
# 3. Login: heroku login
# 4. Create app: heroku create your-app-name
# 5. Deploy: git push heroku main
# 6. Get URL from Heroku dashboard
```

#### Option 3: Replit
```
1. Create new Replit project
2. Import from GitHub or upload files
3. Click "Run" - Replit provides public URL
```

### Deploy Frontend (React app)

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel

# Follow prompts and select the folder with index.html
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir .
```

#### Option 3: GitHub Pages
```bash
# Simple but requires updating socket.io server URL
# See "Configuration" section below
```

## ⚙️ Configuration

### Update Server URL for Deployment

After deploying the backend, update the server URL in `chat-frontend.jsx`:

```javascript
// Line ~49 - Change this:
socketRef.current = io('http://localhost:3001', {

// To your deployed server URL:
socketRef.current = io('https://your-app.railway.app', {
// or
socketRef.current = io('https://your-app.herokuapp.com', {
// or  
socketRef.current = io('https://your-app.replit.dev', {
```

### HTTPS/SSL Certificate

For production, ensure your server uses HTTPS. Most hosting providers (Railway, Heroku, Vercel, Netlify) provide free SSL certificates.

## 📱 How to Use

### Creating a Room
1. Click **"Create New Room"**
2. The app generates a unique room ID
3. Click **"Copy Room ID"** to copy to clipboard
4. Share the room ID with anyone

### Joining a Room
1. Paste the room ID in the input field
2. Click **"Join Room"**
3. Allow microphone access when prompted
4. Wait for others to join

### Starting a Voice Call
1. Both users in the room
2. One user clicks **"Start Voice Call"**
3. The other user will receive the call
4. Both accept microphone permission
5. Voice chat begins!

### Sending Messages
1. Type in the message box
2. Press Enter or click Send
3. Message appears for all users in the room

## 🔒 Security & Privacy

- ✅ All voice data is peer-to-peer (not recorded on server)
- ✅ No user data stored
- ✅ No accounts or authentication needed
- ⚠️ Room IDs are not secret - only share with intended people
- ⚠️ Messages are not encrypted (use HTTPS in production)

## 🐛 Troubleshooting

### "Can't connect to server"
- Check if backend is running on port 3001
- Update socket.io URL in frontend
- Check firewall settings
- Verify CORS is enabled

### "Microphone access denied"
- Check browser permissions for your domain
- Ensure HTTPS in production
- Try different browser
- Check if microphone is working

### "Can't hear other person"
- Check browser volume
- Verify both users allowed microphone access
- Check network connection
- Try calling from different browser

### "Room keeps disconnecting"
- Stability depends on internet connection
- Refresh page to rejoin
- Check if server is still running
- Look at browser console for errors (F12)

## 📚 Code Structure

```
anonymous-chat-app/
├── server.js              # Node.js backend server
├── chat-frontend.jsx      # React component
├── chat.css              # Styling
├── index.html            # HTML template
├── package.json          # Dependencies
└── SETUP_GUIDE.md        # This file
```

### Key Files Explained

**server.js**
- Handles socket.io connections
- Manages rooms and participants
- Forwards WebRTC signaling (offer/answer/ICE)
- Relays chat messages

**chat-frontend.jsx**
- React component for UI
- Manages WebRTC peer connections
- Handles socket.io events
- Local and remote audio streams

**chat.css**
- Responsive design
- Gradient backgrounds
- Message styling
- Audio indicators

## 🚀 Enhancements You Can Add

1. **Video Chat** - Extend WebRTC to include video
2. **Message History** - Store messages in database
3. **User Nicknames** - Let users set custom names
4. **Screen Sharing** - Share desktop via WebRTC
5. **File Transfer** - Send files through data channels
6. **Message Encryption** - End-to-end encryption
7. **Rate Limiting** - Prevent spam
8. **Message Reactions** - Emoji reactions on messages
9. **Multiple Participants** - Support 3+ users in one room
10. **Recording** - Record voice calls (with permission)

## 📝 Example Deployment URL

Once deployed, users would access your app like:
```
https://your-chat-app.vercel.app/?roomId=room-abc123xyz
```

Or simply create new rooms:
```
https://your-chat-app.vercel.app/
```

## 💡 Tips for Best Experience

- Use a headset with microphone for better audio quality
- Test microphone permissions before sharing link
- Use modern browsers (Chrome, Firefox, Edge, Safari)
- Ensure stable internet connection
- Keep only 2 users in a room for best performance (WebRTC peer-to-peer)

## 📄 License

MIT License - Feel free to use and modify!

## ❓ FAQ

**Q: Can more than 2 people use the same room?**
A: Yes, but audio quality degrades with more participants. For group calls, you'd need a media server (TURN server).

**Q: Is this free to use?**
A: Yes! Free hosting options are available (Railway, Replit, Vercel free tier).

**Q: Where are messages stored?**
A: Messages are not stored - they only exist during the session.

**Q: Can the server see the voice data?**
A: No - WebRTC is peer-to-peer, data doesn't go through the server.

**Q: How do I add authentication later?**
A: Modify the backend to require tokens before joining rooms.

---

Happy chatting! 🎉

For issues or improvements, check the console (F12 > Console tab) for error messages.
