import React, { useState, useEffect, useRef } from 'react';
import './chat-enhanced.css';

const EnhancedChatRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionState, setConnectionState] = useState('idle');
  const [typing, setTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef('');
  const recordingTimeRef = useRef(0);

  // Keep ref in sync so async recorder callbacks always use the current room
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Generate unique room ID
  const generateRoomId = () => {
    return 'room-' + Math.random().toString(36).substr(2, 9);
  };

  // Initialize Socket.io connection
  useEffect(() => {
    const io = window.io;
    if (!io) {
      console.error('Socket.io not loaded');
      return;
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    socketRef.current = io('https://open-chat-sooty.vercel.app', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setConnectionState('connected');
    });

    socketRef.current.on('disconnect', () => {
      setConnectionState('disconnected');
      setJoined(false);
    });

    socketRef.current.on('chat-message', (data) => {
      setMessages(prev => [...prev, {
        type: 'text',
        text: data.message,
        sender: 'remote',
        timestamp: new Date().toLocaleTimeString()
      }]);
    });
    socketRef.current.on('voice-message', (data) => {
      console.log('Voice message received', data.duration);
      setMessages(prev => [...prev, {
        type: 'voice',
        audioUrl: data.audio,
        duration: data.duration || 0,
        sender: 'remote',
        timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString()
      }]);
    });
    socketRef.current.on('history', (data) => {
      if (data.messages && Array.isArray(data.messages)) {
        const restored = data.messages.map(m => m.type === 'voice'
          ? { type: 'voice', audioUrl: m.audio, duration: m.duration || 0, sender: 'remote', timestamp: new Date(m.timestamp).toLocaleTimeString() }
          : { type: 'text', text: m.message, sender: 'remote', timestamp: new Date(m.timestamp).toLocaleTimeString() });
        setMessages(prev => [...prev, ...restored]);
      }
    });
    socketRef.current.on('participant-count', (count) => {
      setParticipantCount(count);
    });
    socketRef.current.on('typing', () => {
      setRemoteTyping(true);
    });
    socketRef.current.on('stopped-typing', () => {
      setRemoteTyping(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopMicTracks();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopMicTracks = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
  };

  // Join room (no mic permission required upfront)
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    socketRef.current.emit('join-room', { roomId });
    setJoined(true);
    setConnectionState('connected');
    setMessages([{ type: 'system', text: 'You joined the room', sender: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  // Create room (no mic permission required upfront)
  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    socketRef.current.emit('join-room', { roomId: newRoomId });
    setJoined(true);
    setConnectionState('connected');
    setMessages([{ type: 'system', text: `Room created: ${newRoomId}`, sender: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  // Add system message
  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      type: 'system',
      text,
      sender: 'system',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Handle typing
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socketRef.current.emit('typing', { roomId });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socketRef.current.emit('stopped-typing', { roomId });
    }, 2000);
  };

  // Send text message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, {
      type: 'text',
      text: inputMessage,
      sender: 'local',
      timestamp: new Date().toLocaleTimeString()
    }]);
    socketRef.current.emit('chat-message', {
      roomId: roomId,
      message: inputMessage
    });
    setInputMessage('');
    setTyping(false);
    socketRef.current.emit('stopped-typing', { roomId });
  };

  // --- Voice messages ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingTimeRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const duration = recordingTimeRef.current;
        const currentRoom = roomIdRef.current;
        stopMicTracks();
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (blob.size === 0) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioUrl = reader.result;
          console.log('Sending voice message', { room: currentRoom, duration, size: String(audioUrl).length });
          setMessages(prev => [...prev, { type: 'voice', audioUrl, duration, sender: 'local', timestamp: new Date().toLocaleTimeString() }]);
          socketRef.current.emit('voice-message', { roomId: currentRoom, audio: audioUrl, duration });
          addSystemMessage(`🎤 Voice message sent (${formatTime(duration)})`);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 120) { stopRecording(); }
      }, 1000);
    } catch (err) {
      alert('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopMicTracks();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        stopMicTracks();
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
      mediaRecorderRef.current.stop();
    } else {
      stopMicTracks();
      setIsRecording(false);
      setRecordingTime(0);
    }
    audioChunksRef.current = [];
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Copy room ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  if (!joined) {
    return (
      <div className="container login-container">
        <div className="card">
          <h1>💬 Anonymous Chat Room</h1>
          <p className="subtitle">Connect with others anonymously • Text + Voice Messages</p>

          <div className="form-group">
            <input
              type="text"
              placeholder="Enter Room ID to join"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom(e)}
            />
            <button onClick={handleJoinRoom} className="btn btn-primary">
              Join Room
            </button>
          </div>

          <div className="divider">OR</div>

          <button onClick={handleCreateRoom} className="btn btn-secondary">
            Create New Room
          </button>

          <div className="info-box">
            <p>✅ No registration needed</p>
            <p>✅ Completely anonymous</p>
            <p>✅ Text + voice messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container chat-container">
      <div className="chat-header">
        <div>
          <h1>Chat Room</h1>
          <p className="room-info">ID: <strong>{roomId}</strong></p>
        </div>
        <div className="header-right">
          <span className={`status status-${connectionState}`}>
            ● {connectionState}
          </span>
          <div className="participants">👥 {participantCount}</div>
        </div>
      </div>

      <div className="chat-controls">
        <button
          onClick={copyRoomId}
          className="btn btn-small"
          title="Copy room ID to share"
        >
          📋 Copy ID
        </button>
      </div>

      <div className="chat-content">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message message-${msg.sender}`}
            >
              <span className="timestamp">{msg.timestamp}</span>
              {msg.type === 'voice' ? (
                <span className="voice-message">
                  <span className="voice-icon">🎤</span>
                  <audio controls src={msg.audioUrl} preload="metadata" />
                  <span className="voice-duration">{formatTime(msg.duration || 0)}</span>
                </span>
              ) : (
                <span className="text">{msg.text}</span>
              )}
            </div>
          ))}
          {remoteTyping && (
            <div className="message message-remote typing">
              <span className="typing-indicator">✏️ typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isRecording && (
        <div className="recording-bar">
          <span className="rec-dot">🔴</span>
          <span>Recording... {formatTime(recordingTime)}</span>
          <button onClick={stopRecording} className="btn btn-small btn-success">✔ Send</button>
          <button onClick={cancelRecording} className="btn btn-small btn-danger">✖ Cancel</button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={handleInputChange}
        />
        {!isRecording ? (
          <button type="button" onClick={startRecording} className="btn btn-small" title="Record voice message">🎤</button>
        ) : (
          <button type="button" onClick={stopRecording} className="btn btn-small btn-success" title="Stop and send">⏹</button>
        )}
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  );
};

export default EnhancedChatRoom;
