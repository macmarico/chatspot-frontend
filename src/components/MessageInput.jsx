import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './MessageInput.css';

const MessageInput = () => {
  const { sendMessage, connected } = useSocket();
  const [receiverId, setReceiverId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendStatus, setSendStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!receiverId.trim() || !messageText.trim()) {
      setSendStatus({
        success: false,
        message: 'Receiver ID and message are required'
      });
      return;
    }
    
    const success = sendMessage(receiverId, messageText);
    
    if (success) {
      setSendStatus({
        success: true,
        message: 'Message sent successfully'
      });
      setMessageText(''); // Clear message input after sending
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSendStatus(null);
      }, 3000);
    } else {
      setSendStatus({
        success: false,
        message: 'Failed to send message'
      });
    }
  };

  return (
    <div className="message-input">
      <h2>Send Message</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="receiver-id">Receiver ID:</label>
          <input
            id="receiver-id"
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            disabled={!connected}
            placeholder="Enter recipient's user ID"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message-text">Message:</label>
          <textarea
            id="message-text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!connected}
            placeholder="Type your message here..."
            rows={4}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!connected}
        >
          Send Message
        </button>
      </form>
      
      {sendStatus && (
        <div className={`send-status ${sendStatus.success ? 'success' : 'error'}`}>
          {sendStatus.message}
        </div>
      )}
      
      {!connected && (
        <div className="connection-required">
          Connect to a server to send messages
        </div>
      )}
    </div>
  );
};

export default MessageInput;
