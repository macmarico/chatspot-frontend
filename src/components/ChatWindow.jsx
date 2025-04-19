import { useSocket } from '../context/SocketContext';
import './ChatWindow.css';

const ChatWindow = () => {
  const { messages, connected } = useSocket();

  // Format timestamp if available
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      <h2>Messages</h2>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            {connected 
              ? 'No messages yet. Messages will appear here when received.' 
              : 'Connect to a server to receive messages.'}
          </div>
        ) : (
          <ul className="message-list">
            {messages.map((msg, index) => (
              <li key={index} className="message-item">
                <div className="message-header">
                  <span className="sender-id">
                    From: {msg.sender_id || 'Unknown'}
                  </span>
                  {msg.timestamp && (
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  )}
                </div>
                <div className="message-content">{msg.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
