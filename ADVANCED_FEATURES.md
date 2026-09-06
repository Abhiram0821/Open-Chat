# 🎨 Advanced Features & Extensions Guide

Build upon the basic chat application with these advanced features.

---

## 📝 Table of Contents

1. [Screen Sharing](#screen-sharing)
2. [Message Encryption](#message-encryption)
3. [Video Recording](#video-recording)
4. [File Transfer](#file-transfer)
5. [Message Reactions](#message-reactions)
6. [User Profiles](#user-profiles)
7. [Multiple Participants](#multiple-participants)
8. [Message Persistence](#message-persistence)
9. [Notification System](#notification-system)
10. [Mobile App](#mobile-app)

---

## 🖥️ Screen Sharing

Add screen sharing capability to voice/video calls.

### Installation
```bash
npm install --save-dev @types/dom-mediacapture-transform
```

### Implementation

```javascript
// Add to EnhancedChatRoom component

const [isScreenSharing, setIsScreenSharing] = useState(false);
const screenStreamRef = useRef(null);

const toggleScreenShare = async () => {
  if (!isScreenSharing) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track?.kind === 'video');

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Handle screen share stop
      screenTrack.onended = () => {
        toggleScreenShare();
      };

      addSystemMessage('🖥️ Screen sharing started');
    } catch (err) {
      console.error('Error sharing screen:', err);
      alert('Error starting screen share: ' + err.message);
    }
  } else {
    // Stop screen sharing
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track?.kind === 'video');
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }
    }

    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    setIsScreenSharing(false);
    addSystemMessage('🖥️ Screen sharing stopped');
  }
};

// Add to JSX
<button 
  onClick={toggleScreenShare}
  className={`btn btn-small ${isScreenSharing ? 'active' : ''}`}
>
  {isScreenSharing ? '⛔ Stop Sharing' : '🖥️ Share Screen'}
</button>
```

---

## 🔐 Message Encryption

End-to-end encryption using TweetNaCl.

### Installation
```bash
npm install tweetnacl tweetnacl-util
```

### Implementation

```javascript
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

class MessageEncryption {
  constructor() {
    this.publicKey = null;
    this.secretKey = null;
    this.remotePublicKey = null;
    this.generateKeyPair();
  }

  generateKeyPair() {
    const keyPair = nacl.box.keyPair();
    this.publicKey = encodeBase64(keyPair.publicKey);
    this.secretKey = keyPair.secretKey;
  }

  encryptMessage(message, recipientPublicKey) {
    const nonce = nacl.randomBytes(24);
    const messageUint8 = nacl.util.decodeUTF8(message);
    const publicKeyUint8 = decodeBase64(recipientPublicKey);
    
    const encryptedBox = nacl.box(
      messageUint8,
      nonce,
      publicKeyUint8,
      this.secretKey
    );

    return {
      encrypted: encodeBase64(encryptedBox),
      nonce: encodeBase64(nonce)
    };
  }

  decryptMessage(encryptedData, senderPublicKey) {
    try {
      const nonce = decodeBase64(encryptedData.nonce);
      const encryptedMessage = decodeBase64(encryptedData.encrypted);
      const senderPublicKeyUint8 = decodeBase64(senderPublicKey);

      const decryptedMessage = nacl.box.open(
        encryptedMessage,
        nonce,
        senderPublicKeyUint8,
        this.secretKey
      );

      return nacl.util.encodeUTF8(decryptedMessage);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  }
}

// Usage
const encryption = new MessageEncryption();

// Exchange public keys on connection
socketRef.current.emit('exchange-keys', {
  roomId,
  publicKey: encryption.publicKey
});

socketRef.current.on('public-key', (data) => {
  encryption.remotePublicKey = data.publicKey;
});

// Encrypt message before sending
const handleSendMessage = (e) => {
  e.preventDefault();
  if (!inputMessage.trim() || !encryption.remotePublicKey) return;

  const encrypted = encryption.encryptMessage(
    inputMessage,
    encryption.remotePublicKey
  );

  socketRef.current.emit('encrypted-message', {
    roomId,
    encrypted: encrypted.encrypted,
    nonce: encrypted.nonce
  });

  setInputMessage('');
};

// Decrypt received message
socketRef.current.on('encrypted-message', (data) => {
  const decrypted = encryption.decryptMessage(data, data.senderId);
  setMessages(prev => [...prev, {
    text: decrypted,
    sender: 'remote',
    timestamp: new Date().toLocaleTimeString()
  }]);
});
```

---

## 🎥 Video Recording

Record voice/video calls with audio and video.

### Installation
```bash
npm install recordrtc
```

### Implementation

```javascript
import RecordRTC from 'recordrtc';

const [isRecording, setIsRecording] = useState(false);
const recorderRef = useRef(null);

const startRecording = () => {
  const stream = new MediaStream();
  
  // Add audio tracks
  if (localStreamRef.current) {
    localStreamRef.current.getAudioTracks().forEach(track => {
      stream.addTrack(track);
    });
  }
  if (remoteAudioRef.current?.srcObject) {
    remoteAudioRef.current.srcObject.getAudioTracks().forEach(track => {
      stream.addTrack(track);
    });
  }

  recorderRef.current = new RecordRTC(stream, {
    type: 'audio',
    mimeType: 'audio/webm',
    desiredSampleRate: 48000
  });

  recorderRef.current.startRecording();
  setIsRecording(true);
  addSystemMessage('🔴 Recording started');
};

const stopRecording = () => {
  recorderRef.current.stopRecording(() => {
    const blob = recorderRef.current.getBlob();
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-${new Date().getTime()}.webm`;
    a.click();
    
    setIsRecording(false);
    addSystemMessage('⏹️ Recording saved');
  });
};
```

---

## 📁 File Transfer

Transfer files through WebRTC data channels.

### Implementation

```javascript
const [isFileTransferActive, setIsFileTransferActive] = useState(false);
const dataChannelRef = useRef(null);

const createDataChannel = () => {
  const dataChannel = peerConnectionRef.current.createDataChannel('file-transfer', {
    ordered: true
  });
  setupDataChannel(dataChannel);
};

const setupDataChannel = (dataChannel) => {
  dataChannelRef.current = dataChannel;

  dataChannel.onopen = () => {
    setIsFileTransferActive(true);
    console.log('Data channel opened');
  };

  dataChannel.onclose = () => {
    setIsFileTransferActive(false);
    console.log('Data channel closed');
  };

  dataChannel.onmessage = (event) => {
    const blob = new Blob([event.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'received-file';
    a.click();
    addSystemMessage('📥 File received');
  };
};

const sendFile = (file) => {
  if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
    alert('Data channel not ready');
    return;
  }

  const chunkSize = 16384;
  let offset = 0;

  const reader = new FileReader();
  reader.onload = (e) => {
    dataChannelRef.current.send(e.target.result);
    offset += chunkSize;
    
    if (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    } else {
      addSystemMessage('📤 File sent');
    }
  };

  const slice = file.slice(offset, offset + chunkSize);
  reader.readAsArrayBuffer(slice);
};

// File input handler
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    sendFile(file);
  }
};

// Add to JSX
<input
  type="file"
  onChange={handleFileSelect}
  disabled={!isFileTransferActive}
  className="file-input"
/>
```

---

## 😊 Message Reactions

Add emoji reactions to messages.

### Backend Update

```javascript
// Add to server.js
socket.on('message-reaction', (data) => {
  const { roomId, messageId, emoji } = data;
  
  socket.to(roomId).emit('message-reaction', {
    messageId,
    emoji,
    userId: socket.id
  });
});
```

### Frontend Update

```javascript
const [messageReactions, setMessageReactions] = useState({});

const addReaction = (messageIdx, emoji) => {
  socketRef.current.emit('message-reaction', {
    roomId,
    messageId: messageIdx,
    emoji
  });

  setMessageReactions(prev => ({
    ...prev,
    [messageIdx]: [...(prev[messageIdx] || []), emoji]
  }));
};

socketRef.current.on('message-reaction', (data) => {
  setMessageReactions(prev => ({
    ...prev,
    [data.messageId]: [...(prev[data.messageId] || []), data.emoji]
  }));
});

// Render reactions
{messageReactions[idx]?.map((emoji, i) => (
  <span key={i} className="reaction">{emoji}</span>
))}
```

---

## 👤 User Profiles

User identification with nicknames and avatars.

### Implementation

```javascript
const [userProfile, setUserProfile] = useState({
  nickname: `User-${Math.random().toString(36).substr(2, 5)}`,
  avatar: '👤'
});

const [remoteProfile, setRemoteProfile] = useState(null);

// Exchange profiles on join
socket.on('join-room', () => {
  socketRef.current.emit('profile-update', {
    roomId,
    profile: userProfile
  });
});

socketRef.current.on('user-profile', (data) => {
  setRemoteProfile(data.profile);
});

// Display profiles
<div className="chat-participants">
  <div className="participant">
    <span className="avatar">{userProfile.avatar}</span>
    <span className="name">{userProfile.nickname} (You)</span>
  </div>
  {remoteProfile && (
    <div className="participant">
      <span className="avatar">{remoteProfile.avatar}</span>
      <span className="name">{remoteProfile.nickname}</span>
    </div>
  )}
</div>
```

---

## 👥 Multiple Participants (3+ Users)

Convert peer-to-peer to multi-peer communication.

### Using SFU (Selective Forwarding Unit) Pattern

```bash
npm install mediasoup
```

See MediaSoup documentation for server-side implementation.

Alternatively, use a managed service:
- Agora
- Twilio
- OpenVidu

---

## 💾 Message Persistence

Store messages in MongoDB/Firebase.

### Using Firebase

```bash
npm install firebase
```

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const saveMessage = async (roomId, message, sender) => {
  await addDoc(collection(db, 'messages'), {
    roomId,
    message,
    sender,
    timestamp: new Date()
  });
};

const loadMessages = async (roomId) => {
  const q = query(collection(db, 'messages'), where('roomId', '==', roomId));
  const querySnapshot = await getDocs(q);
  const messages = [];
  querySnapshot.forEach((doc) => {
    messages.push(doc.data());
  });
  return messages;
};
```

---

## 🔔 Notification System

Send desktop notifications.

### Implementation

```javascript
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }
  return false;
};

const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '🎤',
      badge: '🎤',
      ...options
    });
  }
};

// Usage
socketRef.current.on('user-joined', (data) => {
  sendNotification('User joined', {
    body: `${data.participantCount} participants in room`
  });
});

socketRef.current.on('chat-message', (data) => {
  sendNotification('New message', {
    body: data.message.substring(0, 50)
  });
});
```

---

## 📱 Mobile App

Build native iOS/Android app with React Native.

### Installation
```bash
npx create-expo-app chat-mobile
cd chat-mobile
npm install socket.io-client react-native-webrtc
```

### Basic Structure
```javascript
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';
import { RTCView, mediaDevices } from 'react-native-webrtc';

export default function ChatScreen() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const socketRef = useRef(null);

  const joinRoom = async () => {
    socketRef.current = io('your-server-url');
    socketRef.current.emit('join-room', { roomId });
    setJoined(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {!joined ? (
        <View>
          <TextInput
            placeholder="Enter Room ID"
            value={roomId}
            onChangeText={setRoomId}
          />
          <TouchableOpacity onPress={joinRoom}>
            <Text>Join Room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text>Connected to {roomId}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 🧪 Testing Advanced Features

```bash
npm install --save-dev jest supertest socket.io-client
```

Example test:

```javascript
describe('Message Encryption', () => {
  it('should encrypt and decrypt messages', () => {
    const encryption = new MessageEncryption();
    const message = 'Hello World';
    
    const encrypted = encryption.encryptMessage(message, encryption.publicKey);
    const decrypted = encryption.decryptMessage(encrypted, encryption.publicKey);
    
    expect(decrypted).toBe(message);
  });
});
```

---

## 📊 Comparison Table

| Feature | Difficulty | Time | Priority |
|---------|-----------|------|----------|
| Screen Sharing | Medium | 2-3 hrs | High |
| Encryption | Hard | 4-6 hrs | High |
| Recording | Medium | 2-3 hrs | Medium |
| File Transfer | Medium | 2-3 hrs | Medium |
| Reactions | Easy | 1 hr | Low |
| Profiles | Easy | 1-2 hrs | Medium |
| Multiple Users | Hard | 8+ hrs | High |
| Persistence | Medium | 3-4 hrs | Medium |
| Notifications | Easy | 1 hr | Low |
| Mobile App | Hard | 20+ hrs | Low |

---

## 🚀 Recommended Implementation Order

1. **Message Reactions** - Quick win
2. **User Profiles** - Better UX
3. **Desktop Notifications** - Engagement
4. **File Transfer** - Useful feature
5. **Screen Sharing** - Advanced feature
6. **Message Encryption** - Security
7. **Video Recording** - Nice to have
8. **Message Persistence** - Scalability
9. **Multiple Participants** - Major feature
10. **Mobile App** - Long-term project

---

**Happy Coding! 🎉**
