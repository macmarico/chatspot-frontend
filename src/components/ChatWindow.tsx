import { useSelector, useDispatch } from 'react-redux';
import { selectConnected, sendMessageRequest } from '../redux/slices/socketSlice';
import { selectUser } from '../redux/slices/authSlice';
import { selectIsUserTyping } from '../redux/slices/typingSlice';
import { clearCurrentReceiver } from '../redux/slices/chatDBSlice';
import './ChatWindow.css';
import { RootState } from '../redux/store';
import { useState, useEffect, useRef } from 'react';
import UserInfo from './UserInfo';
import ClearChatModal from './ClearChatModal';
import DeleteUserModal from './DeleteUserModal';
// We don't need to import chatDBService anymore as the socketSaga handles clearing

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  type?: 'text' | 'clear_chat' | 'typing' | 'delete_user'; // Add message type
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
  const [showDeleteUserModal, setShowDeleteUserModal] = useState<boolean>(false);
  const [deletingUser, setDeletingUser] = useState<boolean>(false);
  const [chatCleared, setChatCleared] = useState<boolean>(false);
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset chatCleared state if new messages arrive
    if (messages.length > 0) {
      setChatCleared(false);
    }
  }, [messages]);

  // Get typing status from Redux
  const isTyping = receiverId ? useSelector((state: RootState) =>
    selectIsUserTyping(state, receiverId)
  ) : false;

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

      // First, send a clear_chat type message to notify the other user to clear their chat
      dispatch(sendMessageRequest({
        receiverId,
        messageText: 'Chat cleared',
        messageType: 'clear_chat' // Use the new message type system
      }));

      // The socketSaga will handle clearing the local database when sending a clear_chat message
      // This ensures both sides clear their messages consistently

      // Set chat cleared state to true
      setChatCleared(true);

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

  // Handle opening the delete user modal
  const handleOpenDeleteUserModal = () => {
    setShowDeleteUserModal(true);
  };

  // Handle closing the delete user modal
  const handleCloseDeleteUserModal = () => {
    setShowDeleteUserModal(false);
  };

  // Handle deleting the user
  const handleDeleteUser = async () => {
    if (!currentUser || !receiverId) return;

    try {
      setDeletingUser(true);

      // Send a delete_user type message to notify the other user to delete the room
      dispatch(sendMessageRequest({
        receiverId,
        messageText: 'User deleted',
        messageType: 'delete_user'
      }));

      // The socketSaga will handle deleting the user room when sending a delete_user message
      // This ensures both sides delete the room consistently

      // Clear the current receiver to close the chat window
      dispatch(clearCurrentReceiver());

      setShowDeleteUserModal(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setDeletingUser(false);
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
                {connected ? (
                  isTyping ? (
                    <>
                      <span className="typing-text">Typing</span>
                      <span className="header-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </>
                  ) : 'Online'
                ) : 'Offline'}
              </span>
              <div className="chat-header-buttons">
                <button
                  className="clear-chat-btn"
                  onClick={handleOpenClearModal}
                  title="Clear all messages"
                >
                  <span className="clear-icon">🗑️</span>
                  <span className="clear-text">Clear Chat</span>
                </button>
                <button
                  className="delete-user-btn"
                  onClick={handleOpenDeleteUserModal}
                  title="Delete this user"
                >
                  <span className="delete-icon">❌</span>
                  <span className="delete-text">Delete User</span>
                </button>
              </div>
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
                  {message.type === 'clear_chat' ? (
                    <div className="message-system">
                      <div className="message-content system">
                        <p>Chat cleared by {message.is_mine ? 'you' : message.sender_id}</p>
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  ) : message.type === 'typing' ? (
                    // Don't show typing messages in the chat window
                    null
                  ) : (
                    // Regular text message
                    <div className={`message ${message.is_mine ? 'sent' : 'received'}`}>
                      <div className="message-content">
                        <p>{message.message}</p>
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
          </div>
        ) : (
          <div className="no-messages">
            {!receiverId
              ? 'Select a contact to view messages'
              : !connected
                ? 'Connect to a server to receive messages.'
                : chatCleared
                  ? 'Chat has been cleared'
                  : 'No messages yet. Start the conversation!'}
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

      {showDeleteUserModal && (
        <DeleteUserModal
          onClose={handleCloseDeleteUserModal}
          onConfirm={handleDeleteUser}
          loading={deletingUser}
          username={receiverId || undefined}
        />
      )}
    </div>
  );
};

export default ChatWindow;
