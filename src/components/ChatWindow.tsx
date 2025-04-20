import { useSelector, useDispatch } from 'react-redux';
import { selectConnected, sendMessageRequest } from '../redux/slices/socketSlice';
import { selectUser } from '../redux/slices/authSlice';
import './ChatWindow.css';
import { RootState } from '../redux/store';
import { useState, useEffect, useRef } from 'react';
import UserInfo from './UserInfo';
import ClearChatModal from './ClearChatModal';
import { chatDBService } from '../database/service';

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: number;
  status: string;
  is_mine: boolean;
}

type MessageRecord = Record<string, any> | Message;

interface ChatWindowProps {
  messages: MessageRecord[];
  receiverId: string | null;
  onClearChat?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages = [], receiverId = null, onClearChat }) => {
  const dispatch = useDispatch();
  const connected = useSelector(selectConnected);
  const currentUser = useSelector(selectUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearingChat, setClearingChat] = useState<boolean>(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Format timestamp if available
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  // Group messages by date
  const getMessageDate = (timestamp: number): string => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return '';
    }
  };

  // Handle opening the clear chat modal
  const handleOpenClearModal = () => {
    setShowClearModal(true);
  };

  // Handle closing the clear chat modal
  const handleCloseClearModal = () => {
    setShowClearModal(false);
  };

  // Handle clearing the chat
  const handleClearChat = async () => {
    if (!currentUser || !receiverId) return;

    try {
      setClearingChat(true);

      // Clear messages in local database
      await chatDBService.clearRoom(currentUser, receiverId);

      // Send a special message to notify the other user to clear their chat too
      dispatch(sendMessageRequest({
        receiverId,
        messageText: '__CLEAR_CHAT__' // Special message type
      }));

      // Call the parent component's onClearChat callback if provided
      if (onClearChat) {
        onClearChat();
      }

      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    } finally {
      setClearingChat(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        {receiverId && (
          <>
            <UserInfo userId={receiverId} className="chat-contact-info" />
            <div className="chat-header-actions">
              <span className="chat-contact-status">
                {connected ? 'Online' : 'Offline'}
              </span>
              <button
                className="clear-chat-btn"
                onClick={handleOpenClearModal}
                title="Clear all messages"
              >
                <span className="clear-icon">🗑️</span>
                <span className="clear-text">Clear Chat</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="messages-container">
        {messages.length > 0 ? (
          <div className="messages-list">
            {/* Group and display messages */}
            {messages.map((message, index) => {
              // Check if we need to display date separator
              const showDateSeparator = index === 0 ||
                getMessageDate(message.timestamp) !== getMessageDate(messages[index - 1].timestamp);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="message-date-separator">
                      <span>{getMessageDate(message.timestamp)}</span>
                    </div>
                  )}
                  <div className={`message ${message.is_mine ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      <p>{message.message}</p>
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
          </div>
        ) : (
          <div className="no-messages">
            {!receiverId
              ? 'Select a contact to view messages'
              : connected
                ? 'No messages yet. Start the conversation!'
                : 'Connect to a server to receive messages.'}
          </div>
        )}
      </div>

      {showClearModal && (
        <ClearChatModal
          onClose={handleCloseClearModal}
          onConfirm={handleClearChat}
          loading={clearingChat}
        />
      )}
    </div>
  );
};

export default ChatWindow;
