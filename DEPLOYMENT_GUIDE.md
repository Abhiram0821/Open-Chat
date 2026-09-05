# 🚀 Advanced Deployment Guide

Comprehensive guide to deploy the Anonymous Chat Application to various platforms.

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Railway.app](#railwayapp)
4. [Heroku](#heroku)
5. [AWS](#aws)
6. [DigitalOcean](#digitalocean)
7. [Vercel + Heroku](#vercel--heroku-combination)
8. [Security Best Practices](#security-best-practices)

---

## 🏠 Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Start backend server
npm start

# In another terminal, start frontend
python -m http.server 3000
# or
npx http-server -p 3000
```

### Development Mode with Auto-Reload

```bash
npm install -D nodemon
npm run dev
```

---

## 🐳 Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose (optional)

### Step 1: Build Image

```bash
docker build -t anonymous-chat:latest .
```

### Step 2: Run Container

```bash
docker run -d \
  --name chat-app \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  anonymous-chat:latest
```

### Step 3: Access Application

```
http://localhost:3001
```

### Using Docker Compose (Recommended)

```bash
# Start both frontend and backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Push to Docker Hub

```bash
# Login
docker login

# Tag image
docker tag anonymous-chat:latest your-username/anonymous-chat:latest

# Push
docker push your-username/anonymous-chat:latest
```

---

## 🚂 Railway.app (Recommended - Free Tier Available)

### Step 1: Create Account
- Visit [railway.app](https://railway.app)
- Sign up with GitHub

### Step 2: Create New Project
- Click "New Project"
- Select "Deploy from GitHub"
- Connect your repository

### Step 3: Configure Environment
```bash
# Railway auto-detects Node.js
# Set these environment variables in Railway dashboard:

NODE_ENV=production
PORT=3001
CORS_ORIGIN=your-frontend-url
```

### Step 4: Deploy
- Railway auto-deploys on push to main branch
- Get your server URL from Railway dashboard

### Step 5: Update Frontend
In `chat-frontend.jsx`, update the server URL:

```javascript
const serverUrl = 'https://your-app-name.railway.app';
socketRef.current = io(serverUrl, { /* ... */ });
```

### Deploy Frontend to Vercel

```bash
npm install -g vercel
vercel deploy
```

---

## 🎛️ Heroku Deployment

### Prerequisites
```bash
npm install -g heroku
heroku login
```

### Step 1: Create Heroku App
```bash
heroku create your-app-name
```

### Step 2: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3001
heroku config:set CORS_ORIGIN=your-frontend-url
```

### Step 3: Deploy
```bash
git push heroku main
```

### Step 4: View Logs
```bash
heroku logs --tail
```

### Get App URL
```bash
heroku open
```

Your server will be at: `https://your-app-name.herokuapp.com`

### Scale Dyno (if needed)
```bash
heroku ps:scale web=1
```

---

## ☁️ AWS Deployment

### Option 1: AWS EC2

#### Step 1: Launch EC2 Instance
- Go to AWS Console
- Launch Ubuntu 22.04 LTS instance
- Open security groups for ports 3000, 3001

#### Step 2: SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 4: Clone Repository
```bash
cd /home/ubuntu
git clone your-repo-url
cd anonymous-chat-app
npm install
```

#### Step 5: Setup PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 start server.js --name "chat-app"
pm2 save
pm2 startup
```

#### Step 6: Setup Nginx (Reverse Proxy)
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add this configuration:
```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80 default_server;
    server_name your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo systemctl restart nginx
```

#### Step 7: Setup SSL (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 anonymous-chat

# Create environment
eb create chat-env

# Deploy
eb deploy

# Open in browser
eb open
```

---

## 💧 DigitalOcean Deployment

### Step 1: Create Droplet
- Go to DigitalOcean Console
- Create new Droplet (Ubuntu 22.04)
- Select Basic plan

### Step 2: SSH Access
```bash
ssh root@your-droplet-ip
```

### Step 3: Install Dependencies
```bash
apt-get update
apt-get install -y nodejs npm nginx
```

### Step 4: Clone Repository
```bash
cd /var/www
git clone your-repo-url
cd anonymous-chat-app
npm install
```

### Step 5: Configure Nginx
```bash
nano /etc/nginx/sites-available/default
```

Use the same nginx config as AWS EC2

```bash
systemctl restart nginx
```

### Step 6: Setup Application Service
```bash
nano /etc/systemd/system/chat-app.service
```

```ini
[Unit]
Description=Anonymous Chat App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/anonymous-chat-app
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl start chat-app
systemctl enable chat-app
```

### Step 7: SSL Certificate
```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 🔄 Vercel + Heroku Combination

Best for separating frontend and backend.

### Frontend on Vercel
```bash
# Vercel automatically deploys static sites
vercel deploy
# Frontend URL: https://your-app.vercel.app
```

### Backend on Heroku
```bash
heroku create your-backend-app
git push heroku main
# Backend URL: https://your-backend-app.herokuapp.com
```

### Update Frontend Configuration
```javascript
// .env.local
REACT_APP_SERVER_URL=https://your-backend-app.herokuapp.com
```

```javascript
// chat-frontend.jsx
const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
socketRef.current = io(serverUrl, { /* ... */ });
```

### Update CORS in Backend
```bash
heroku config:set CORS_ORIGIN=https://your-app.vercel.app
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
Never commit sensitive data:

```bash
# .env (add to .gitignore)
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secret-key
```

### 2. HTTPS/SSL Certificate
Always use HTTPS in production:
- Let's Encrypt (free)
- AWS Certificate Manager
- DigitalOcean managed SSL

### 3. CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 4. Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 5. Helmet.js (Security Headers)
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 6. Input Validation
```javascript
const validator = require('validator');

socket.on('chat-message', (data) => {
  const sanitized = validator.escape(data.message);
  // Process sanitized message
});
```

### 7. Monitoring & Logging
```bash
npm install winston
```

### 8. Regular Updates
```bash
npm update
npm audit fix
```

---

## 📊 Performance Optimization

### 1. Enable Gzip Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. CDN for Static Assets
```javascript
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));
```

### 3. Database Connection Pooling (if using DB)
Use connection pools for better performance

### 4. Caching Strategy
```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### 5. Load Balancing
For multiple servers, use:
- AWS Load Balancer
- DigitalOcean Load Balancer
- Nginx upstream configuration

---

## 🧪 Testing Deployment

### Test API Endpoint
```bash
curl https://your-domain.com/
```

### Test WebSocket Connection
```javascript
// In browser console
const socket = io('https://your-domain.com');
socket.on('connect', () => console.log('Connected!'));
```

### Health Check
```bash
curl https://your-domain.com/api/stats
```

---

## 📈 Monitoring & Maintenance

### Application Monitoring
- PM2 Plus
- New Relic
- Datadog
- AWS CloudWatch

### Error Tracking
- Sentry
- Rollbar
- LogRocket

### Performance Monitoring
- Lighthouse
- WebPageTest
- Google Analytics

### Database Monitoring (if using DB)
- Database Query Logs
- Slow Query Monitoring
- Connection Pool Status

---

## 🆘 Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| "Port already in use" | Change PORT env var or kill process |
| "CORS error" | Update CORS_ORIGIN in env |
| "WebSocket connection failed" | Check firewall/proxy settings |
| "Out of memory" | Increase instance size or optimize code |
| "Slow connection" | Add caching, enable gzip, use CDN |

---

## 💡 Recommended Deployment Stack

**For Small Projects (< 10 concurrent users):**
- Frontend: Vercel
- Backend: Railway or Heroku Free Tier

**For Medium Projects (10-100 concurrent users):**
- Frontend: Vercel Pro
- Backend: Railway Pro or AWS EC2

**For Large Projects (100+ concurrent users):**
- Frontend: Vercel Pro
- Backend: AWS ECS/EKS or Kubernetes
- Database: Amazon RDS
- CDN: CloudFront
- Monitoring: CloudWatch + Datadog

---

## 📞 Support & Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)

---

**Happy Deploying! 🎉**
