import { useSelector } from 'react-redux';
import { selectConnected } from '../redux/slices/socketSlice';
import { selectUser } from '../redux/slices/authSlice';
import './ChatWindow.css';
import { RootState } from '../redux/store';
import { useEffect, useRef } from 'react';
import UserInfo from './UserInfo';

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
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages = [], receiverId = null }) => {
  const connected = useSelector(selectConnected);
  const currentUser = useSelector(selectUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        {receiverId && (
          <>
            <UserInfo userId={receiverId} className="chat-contact-info" />
            <span className="chat-contact-status">
              {connected ? 'Online' : 'Offline'}
            </span>
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
    </div>
  );
};

export default ChatWindow;
