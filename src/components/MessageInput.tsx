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

    // Send as a text message type
    dispatch(sendMessageRequest({
      receiverId,
      messageText: message.trim(),
      messageType: 'text'
    }));
    setMessage('');

    // Focus back on the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
      // Reset height
      inputRef.current.style.height = 'auto';
    }
  };

  // Typing indicator state
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send typing indicator
  const sendTypingIndicator = (typing: boolean) => {
    if (connected && receiverId) {
      dispatch(sendMessageRequest({
        receiverId,
        messageText: typing ? 'typing' : 'stopped_typing',
        messageType: 'typing'
      }));
    }
  };

  // Handle textarea height adjustment and typing indicator
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    const newValue = target.value;
    setMessage(newValue);

    // Reset height to auto to properly calculate the new height
    target.style.height = 'auto';

    // Set new height based on scrollHeight (with a max height)
    // Ensure a minimum height of 44px (or 40px on mobile)
    const minHeight = window.innerWidth <= 767 ? 40 : 44;
    const newHeight = Math.max(minHeight, Math.min(target.scrollHeight, 120));
    target.style.height = `${newHeight}px`;

    // Handle typing indicator
    if (newValue.trim() && !isTyping) {
      // User started typing
      setIsTyping(true);
      sendTypingIndicator(true);
    } else if (!newValue.trim() && isTyping) {
      // User stopped typing
      setIsTyping(false);
      sendTypingIndicator(false);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a timeout to stop the typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 3000);
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

      // Clear typing timeout and send stopped typing on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping && connected && receiverId) {
        sendTypingIndicator(false);
      }
    };
  }, [isTyping, connected, receiverId]);

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
