import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendMessageRequest,
  selectConnected,
  selectError
} from '../redux/slices/socketSlice';
import './MessageInput.css';

const MessageInput = () => {
  const dispatch = useDispatch();
  const connected = useSelector(selectConnected);
  const error = useSelector(selectError);

  const [receiverId, setReceiverId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendStatus, setSendStatus] = useState(null);

  // Watch for errors from Redux and update send status
  useEffect(() => {
    if (error && error.includes('Failed to send message')) {
      setSendStatus({
        success: false,
        message: error
      });
    }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!receiverId.trim() || !messageText.trim()) {
      setSendStatus({
        success: false,
        message: 'Receiver ID and message are required'
      });
      return;
    }

    // Dispatch the send message action
    dispatch(sendMessageRequest({ receiverId, messageText }));

    // Assume success for now (the saga will handle errors)
    setSendStatus({
      success: true,
      message: 'Message sent successfully'
    });
    setMessageText(''); // Clear message input after sending

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSendStatus(null);
    }, 3000);
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
