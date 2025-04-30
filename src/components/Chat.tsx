import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthToken, selectUser, logout } from '../redux/slices/authSlice';
import { connectRequest, disconnectRequest } from '../redux/slices/socketSlice';
import { setCurrentRoom, setCurrentReceiver, clearCurrentReceiver, selectDBInitialized, selectCurrentRoomId, selectCurrentReceiverUsername, initializeDatabase, setInitialized } from '../redux/slices/chatDBSlice';
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
  const selectedReceiverUsername = useSelector(selectCurrentReceiverUsername);

  // Use WatermelonDB observables
  const rooms = useWatermelonObservable(
    currentUser ? chatDBService.observeRooms(currentUser) : null,
    []
  );

  const messages = useWatermelonObservable(
    (currentUser && selectedReceiverUsername) ?
      chatDBService.observeMessages(currentUser, selectedReceiverUsername) :
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

    console.log('isAuthenticated', isAuthenticated);
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
    if (currentUser && selectedReceiverUsername) {
      const roomId = getRoomId(currentUser, selectedReceiverUsername);
      dispatch(setCurrentRoom(roomId));
    }
  }, [currentUser, selectedReceiverUsername, dispatch]);

  const handleRoomSelect = (username: string) => {
    dispatch(setCurrentReceiver(username));

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

  const handleStartChat = (username: string) => {
    // Prevent chatting with yourself
    if (username !== currentUser) {
      dispatch(setCurrentReceiver(username));
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

  const getAvatarText = () => {
    return currentUser.charAt(0).toUpperCase();
  };

  return (
    <div className="chat-container">
      <div className="chat-content">
        {/* Rooms container - conditionally shown on mobile */}

        <div
          className="rooms-container"
          style={{ display: isMobileView && !showRoomsList ? 'none' : 'flex' }}
          ref={roomsContainerRef}
        >
        <div className="profile-header">
        <div className="header-actions">

        <div className="user-avatar user-avatar-self">
        {getAvatarText()}
      </div>

          <span className="current-user">{currentUser}</span>
          
          
          </div>
          <div>

            <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>

          </div>
          
        </div>
          <div className="rooms-header">
            <div className="tab-header" >CHATS</div>
            <div className="form-group">
                <input placeholder="Search" />
            </div>
      
          </div>
          <RoomsList
            rooms={rooms}
            onRoomSelect={handleRoomSelect}
            selectedUsername={selectedReceiverUsername}
          />
        </div>

        {/* Messages section - conditionally shown on mobile */}
        <div
          className="messages-section"
          style={{ display: isMobileView && showRoomsList ? 'none' : 'flex' }}
          ref={messagesContainerRef}
        >
          {/* Mobile back button - only shown when a chat is active on mobile */}
          {isMobileView && selectedReceiverUsername && (
            <div className={`mobile-nav-controls ${!showRoomsList ? 'active' : ''}`}>
              <button className="back-button" onClick={handleBackToRooms}>
                <span className="back-button-icon">←</span> Back to Chats
              </button>
            </div>
          )}

          {selectedReceiverUsername ? (
            <>
              <div className="chat-window-container">
                <ChatWindow
                  messages={messages}
                  receiverUsername={selectedReceiverUsername}
                  onClearChat={() => console.log('Chat cleared')}
                />
              </div>

              <div className="message-input-container">
                <MessageInput receiverUsername={selectedReceiverUsername} />
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
