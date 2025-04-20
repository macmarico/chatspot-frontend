import { useEffect, useState } from 'react';
import { chatDBService } from '../database/service';
import { useWatermelonObservable } from '../hooks/useWatermelonObservable';
import { initializeDatabase } from '../redux/slices/chatDBSlice';

const ChatDBTest: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [userId, setUserId] = useState('testuser1');
  const [receiverId, setReceiverId] = useState('testuser2');
  const [message, setMessage] = useState('');

  // Initialize database
  useEffect(() => {
    const init = async () => {
      const result = await initializeDatabase();
      setInitialized(result);
      console.log('Database initialized:', result);
    };
    init();
  }, []);

  // Subscribe to rooms
  const rooms = useWatermelonObservable(
    userId ? chatDBService.observeRooms(userId) : null,
    []
  );

  // Subscribe to messages
  const messages = useWatermelonObservable(
    (userId && receiverId) ? 
      chatDBService.observeMessages(userId, receiverId) : 
      null,
    []
  );

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message || !userId || !receiverId) return;
    
    try {
      await chatDBService.saveMessage(userId, receiverId, message, true);
      setMessage('');
      console.log('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>WatermelonDB Reactive Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Database initialized: {initialized ? 'Yes' : 'No'}</p>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Your User ID:
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Receiver ID:
            <input 
              type="text" 
              value={receiverId} 
              onChange={(e) => setReceiverId(e.target.value)}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
      </div>
      
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px' }}
        />
        <button 
          onClick={handleSendMessage}
          style={{ marginLeft: '10px', padding: '8px 16px' }}
        >
          Send
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Rooms</h3>
          {rooms.length === 0 ? (
            <p>No rooms yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rooms.map((room) => (
                <li 
                  key={room.id} 
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd',
                    marginBottom: '5px',
                    borderRadius: '4px'
                  }}
                >
                  <div><strong>User:</strong> {room.user_id}</div>
                  <div><strong>Last message:</strong> {room.last_msg || 'None'}</div>
                  <div><strong>Updated:</strong> {new Date(room.updated).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Messages</h3>
          {messages.length === 0 ? (
            <p>No messages yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {messages.map((msg) => (
                <li 
                  key={msg.id} 
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd',
                    marginBottom: '5px',
                    borderRadius: '4px',
                    backgroundColor: msg.is_mine ? '#f0f0f0' : '#fff'
                  }}
                >
                  <div><strong>From:</strong> {msg.sender_id}</div>
                  <div><strong>To:</strong> {msg.receiver_id}</div>
                  <div><strong>Message:</strong> {msg.message}</div>
                  <div><strong>Time:</strong> {new Date(msg.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDBTest;
