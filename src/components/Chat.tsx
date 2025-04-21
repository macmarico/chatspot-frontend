import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthToken, selectUser, logout } from '../redux/slices/authSlice';
import { connectRequest, disconnectRequest } from '../redux/slices/socketSlice';
import { setCurrentRoom, setCurrentReceiver, clearCurrentReceiver, selectDBInitialized, selectCurrentRoomId, selectCurrentReceiverId, initializeDatabase, setInitialized } from '../redux/slices/chatDBSlice';
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
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 768);
  const [showRoomsList, setShowRoomsList] = useState<boolean>(true);
  const roomsContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Handle window resize to detect mobile/desktop view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);

      // If switching to desktop view, always show both panels
      if (!mobile) {
        setShowRoomsList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    // On mobile, hide the rooms list when a chat is selected
    if (isMobileView) {
      setShowRoomsList(false);
    }
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

      // On mobile, hide the rooms list when a chat is started
      if (isMobileView) {
        setShowRoomsList(false);
      }
    }
  };

  // Handle back button click on mobile
  const handleBackToRooms = () => {
    setShowRoomsList(true);
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
        {/* Rooms container - conditionally shown on mobile */}
        <div
          className="rooms-container"
          style={{ display: isMobileView && !showRoomsList ? 'none' : 'flex' }}
          ref={roomsContainerRef}
        >
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

        {/* Messages section - conditionally shown on mobile */}
        <div
          className="messages-section"
          style={{ display: isMobileView && showRoomsList ? 'none' : 'flex' }}
          ref={messagesContainerRef}
        >
          {/* Mobile back button - only shown when a chat is active on mobile */}
          {isMobileView && selectedReceiverId && (
            <div className={`mobile-nav-controls ${!showRoomsList ? 'active' : ''}`}>
              <button className="back-button" onClick={handleBackToRooms}>
                <span className="back-button-icon">←</span> Back to Chats
              </button>
            </div>
          )}

          {selectedReceiverId ? (
            <>
              <div className="chat-window-container">
                <ChatWindow
                  messages={messages}
                  receiverId={selectedReceiverId}
                  onClearChat={() => console.log('Chat cleared')}
                />
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
