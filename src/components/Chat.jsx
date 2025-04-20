import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthToken, logout } from '../redux/slices/authSlice';
import { connectRequest, disconnectRequest } from '../redux/slices/socketSlice';
import MessageInput from './MessageInput';
import ChatWindow from './ChatWindow';
import './Chat.css';

const Chat = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authToken = useSelector(selectAuthToken);

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

  const handleLogout = () => {
    dispatch(disconnectRequest());
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>ChatSpot Messenger</h2>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="chat-content">
        <div className="message-input-container">
          <MessageInput />
        </div>

        <div className="chat-window-container">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Chat;
