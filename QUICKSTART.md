# ⚡ Quick Start - Run in 5 Minutes

## 1️⃣ Terminal 1: Start Backend Server

```bash
# Install dependencies (first time only)
npm install

# Start server
npm start
```

✅ You should see: `Listening on port 3001`

## 2️⃣ Terminal 2: Start Frontend

```bash
# In a new terminal window
python -m http.server 3000
```

Or use npx:
```bash
npx http-server -p 3000
```

## 3️⃣ Open Browser

Go to: **http://localhost:3000**

## 4️⃣ Test It

**Tab 1:**
- Click "Create New Room"
- Copy the Room ID

**Tab 2:**
- Paste Room ID
- Click "Join Room"

**Either Tab:**
- Click "Start Voice Call"
- Allow microphone access
- Start talking! 🎤

---

## 🌐 Deploy to Production

### Backend: Railway.app
```bash
# 1. Go to railway.app
# 2. Sign up with GitHub
# 3. Import this project
# 4. Deploy (automatic)
# 5. Copy your URL
```

### Frontend: Vercel
```bash
# 1. Go to vercel.com
# 2. Import this project
# 3. Deploy (automatic)
```

### Update Socket URL (In chat-frontend.jsx, line ~49)
```javascript
// Change localhost:3001 to your Railway/deployed URL
socketRef.current = io('https://your-app.railway.app', {
```

---

## 📞 Sharing Your App

Send link to others:
```
https://your-app.vercel.app/
```

They can:
1. Create a new room, or
2. Join an existing room with your Room ID

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Can't connect to server" | Make sure `npm start` is running |
| "Port 3001 already in use" | Kill process: `lsof -ti:3001 \| xargs kill -9` |
| "No microphone access" | Check browser permissions (URL bar → 🔒) |
| "Can't hear anything" | Both users must start voice call |

---

## 📱 Mobile Testing

1. Get your computer's local IP:
   - Mac/Linux: `ifconfig \| grep inet`
   - Windows: `ipconfig`

2. On mobile, visit: `http://YOUR_IP:3000`

---

**That's it! You're ready to chat!** 🚀
