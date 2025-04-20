import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthToken, selectUser, logout } from '../redux/slices/authSlice';
import { connectRequest, disconnectRequest } from '../redux/slices/socketSlice';
import { setCurrentRoom, setCurrentReceiver, selectDBInitialized, selectCurrentRoomId, selectCurrentReceiverId, initializeDatabase, setInitialized } from '../redux/slices/chatDBSlice';
import { chatDBService } from '../database/service';
import { useWatermelonObservable } from '../hooks/useWatermelonObservable';
import MessageInput from './MessageInput';
import ChatWindow from './ChatWindow';
import RoomsList from './RoomsList';
import NewChatModal from './NewChatModal.tsx';
import './Chat.css';
import { getRoomId } from '../database/config';

const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authToken = useSelector(selectAuthToken);
  const currentUser = useSelector(selectUser);
  const dbInitialized = useSelector(selectDBInitialized);
  const currentRoomId = useSelector(selectCurrentRoomId);
  const selectedReceiverId = useSelector(selectCurrentReceiverId);

  // Use WatermelonDB observables
  const rooms = useWatermelonObservable(
    currentUser ? chatDBService.observeRooms(currentUser) : null,
    []
  );

  const messages = useWatermelonObservable(
    (currentUser && selectedReceiverId) ?
      chatDBService.observeMessages(currentUser, selectedReceiverId) :
      null,
    []
  );

  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Initialize database and connect to socket
  useEffect(() => {
    const init = async () => {
      if (!dbInitialized) {
        const result = await initializeDatabase();
        dispatch(setInitialized(result));
      }
    };
    init();
  }, [dbInitialized, dispatch]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Connect to socket with auth token
      dispatch(connectRequest({ authToken }));
    }

    // Disconnect when component unmounts
    return () => {
      dispatch(disconnectRequest());
    };
  }, [isAuthenticated, authToken, dispatch, navigate]);

  // Update room ID when receiver changes
  useEffect(() => {
    if (currentUser && selectedReceiverId) {
      const roomId = getRoomId(currentUser, selectedReceiverId);
      dispatch(setCurrentRoom(roomId));
    }
  }, [currentUser, selectedReceiverId, dispatch]);

  const handleRoomSelect = (userId: string) => {
    dispatch(setCurrentReceiver(userId));
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleCloseModal = () => {
    setShowNewChatModal(false);
  };

  const handleStartChat = (userId: string) => {
    // Prevent chatting with yourself
    if (userId !== currentUser) {
      dispatch(setCurrentReceiver(userId));
      setShowNewChatModal(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>ChatSpot Messenger</h2>
        <div className="header-actions">
          <span className="current-user">{currentUser}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="chat-content">
        <div className="rooms-container">
          <div className="rooms-header">
            <h3>Chats</h3>
            <button className="new-chat-button" onClick={handleNewChat}>
              <span>+</span> New Chat
            </button>
          </div>
          <RoomsList
            rooms={rooms}
            onRoomSelect={handleRoomSelect}
            selectedUserId={selectedReceiverId}
          />
        </div>

        <div className="messages-section">
          {selectedReceiverId ? (
            <>
              <div className="chat-window-container">
                <ChatWindow messages={messages} receiverId={selectedReceiverId} />
              </div>

              <div className="message-input-container">
                <MessageInput receiverId={selectedReceiverId} />
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <div className="no-chat-icon">💬</div>
                <h3>Select a chat or start a new conversation</h3>
                <p>Choose a contact from the list or start a new chat by clicking the "New Chat" button.</p>
                <button className="start-chat-button" onClick={handleNewChat}>Start New Chat</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal onClose={handleCloseModal} onStartChat={handleStartChat} />
      )}
    </div>
  );
};

export default Chat;
