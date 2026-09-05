import React, { useState, useEffect, useRef } from 'react';
import './chat.css';

const ChatRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef('');
  const recordingTimeRef = useRef(0);

  // Keep ref in sync so async recorder callbacks always use the current room
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  const generateRoomId = () => {
    return 'room-' + Math.random().toString(36).substr(2, 9);
  };

  // Initialize Socket.io connection
  useEffect(() => {
    const io = window.io;
    if (!io) {
      console.error('Socket.io not loaded. Make sure to include it in your HTML.');
      return;
    }

    socketRef.current = io('http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
    });

    socketRef.current.on('chat-message', (data) => {
      setMessages(prev => [...prev, { type: 'text', text: data.message, sender: 'remote', timestamp: new Date().toLocaleTimeString() }]);
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
    socketRef.current.on('participant-count', (count) => {
      setParticipantCount(count);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopMicTracks();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const stopMicTracks = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
  };

  // Join room (no microphone needed upfront)
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    socketRef.current.emit('join-room', { roomId });
    setJoined(true);
    setMessages([{ type: 'system', text: 'You joined the room', sender: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  // Create room (no microphone needed upfront)
  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    socketRef.current.emit('join-room', { roomId: newRoomId });
    setJoined(true);
    setMessages([{ type: 'system', text: `Room created: ${newRoomId}`, sender: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  // Send text message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, { type: 'text', text: inputMessage, sender: 'local', timestamp: new Date().toLocaleTimeString() }]);
    socketRef.current.emit('chat-message', {
      roomId: roomId,
      message: inputMessage
    });
    setInputMessage('');
  };

  // --- Voice messages (MediaRecorder, no live call) ---
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
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 120) {
          // auto-stop at 2 minutes
          stopRecording();
        }
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
        recordingTimeRef.current = 0;
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
      mediaRecorderRef.current.stop();
    } else {
      stopMicTracks();
      setIsRecording(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
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
          <p className="subtitle">Connect with others anonymously</p>

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
        <div className="participants">👥 {participantCount} participants</div>
      </div>

      <div className="chat-controls">
        <button
          onClick={copyRoomId}
          className="btn btn-small"
          title="Copy room ID to share with others"
        >
          📋 Copy Room ID
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
          onChange={(e) => setInputMessage(e.target.value)}
        />
        {!isRecording ? (
          <button type="button" onClick={startRecording} className="btn btn-small" title="Record voice message">
            🎤
          </button>
        ) : (
          <button type="button" onClick={stopRecording} className="btn btn-small btn-success" title="Stop and send">
            ⏹
          </button>
        )}
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;
