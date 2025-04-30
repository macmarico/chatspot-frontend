import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import './UserInfo.css';

interface UserInfoProps {
  userId: string; // This is now actually a username
  className?: string;
  lastMessage?: string; // Optional prop for last message
  status?: string; // Optional prop for status
}

interface UserData {
  id: string;
  username: string;
  // Add other user properties as needed
}

const UserInfo: React.FC<UserInfoProps> = ({ userId, className = '', lastMessage, status }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Since userId is now actually a username, we don't need to fetch user info
  useEffect(() => {
    setLoading(false);
    setError(null);
    // Create a simple user data object with the username
    setUserData({
      id: '', // We don't need the ID
      username: userId // userId is actually the username
    });
  }, [userId]);

  // Display first letter of username as avatar
  const getAvatarText = () => {
    return userId.charAt(0).toUpperCase();
  };

  // Display username
  const getDisplayName = () => {
    return userId;
  };

  return (
    <div className={`user-info ${className}`}>
      <div className="user-avatar user-avatar-public">
        {getAvatarText()}
      </div>
      <div className="user-details">
        <span className="user-name">{getDisplayName()}</span>

        {/* Conditionally render last message if it exists */}
        {lastMessage && (
          <div className="room-last-message">
            {lastMessage}
          </div>
        )}

        {/* Conditionally render status if it exists */}
        {status && (
          <span className="chat-contact-status">
            {status === 'Typing' ? (
              <>
                <span className="typing-text">Typing</span>
                <span className="header-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </>
            ) : (
              status
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
