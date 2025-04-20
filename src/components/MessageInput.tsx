import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessageRequest, selectConnected, selectError } from '../redux/slices/socketSlice';
import './MessageInput.css';
import { RootState } from '../redux/store';

interface MessageInputProps {
  receiverId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ receiverId }) => {
  const dispatch = useDispatch();
  const connected = useSelector(selectConnected);
  const error = useSelector(selectError);

  const [message, setMessage] = useState<string>('');
  const [sendStatus, setSendStatus] = useState<{success: boolean, message: string} | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Watch for errors from Redux
  useEffect(() => {
    if (error && error.includes('Failed to send message')) {
      setSendStatus({
        success: false,
        message: error
      });
    }
  }, [error]);

  // Clear send status after 3 seconds
  useEffect(() => {
    if (sendStatus) {
      const timer = setTimeout(() => {
        setSendStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !receiverId || !connected) {
      if (!connected) {
        setSendStatus({
          success: false,
          message: 'Not connected to server'
        });
      }
      return;
    }

    dispatch(sendMessageRequest({ receiverId, messageText: message.trim() }));
    setMessage('');

    // Focus back on the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
      // Reset height
      inputRef.current.style.height = 'auto';
    }
  };

  // Handle textarea height adjustment
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setMessage(target.value);

    // Reset height to auto to properly calculate the new height
    target.style.height = 'auto';

    // Set new height based on scrollHeight (with a max height)
    // Ensure a minimum height of 44px (or 40px on mobile)
    const minHeight = window.innerWidth <= 767 ? 40 : 44;
    const newHeight = Math.max(minHeight, Math.min(target.scrollHeight, 120));
    target.style.height = `${newHeight}px`;
  };

  // Set initial height and handle window resize
  useEffect(() => {
    const setInitialHeight = () => {
      if (inputRef.current) {
        const minHeight = window.innerWidth <= 767 ? 40 : 44;
        inputRef.current.style.height = `${minHeight}px`;
      }
    };

    // Set initial height
    setInitialHeight();

    // Add resize listener to adjust height on window resize
    window.addEventListener('resize', setInitialHeight);

    // Clean up
    return () => {
      window.removeEventListener('resize', setInitialHeight);
    };
  }, []);

  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-wrapper">
      {sendStatus && (
        <div className={`send-status ${sendStatus.success ? 'success' : 'error'}`}>
          {sendStatus.message}
        </div>
      )}

      <form className="message-input-form" onSubmit={handleSubmit}>
        <div className="message-input-container">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Type a message...' : 'Connect to send messages'}
            disabled={!connected || !receiverId}
            className="message-input"
            rows={1}
          />
          <button
            type="submit"
            disabled={!connected || !message.trim() || !receiverId}
            className="send-button"
            title="Send message"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
