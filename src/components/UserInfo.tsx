import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import './UserInfo.css';

interface UserInfoProps {
  userId: string; // This is now actually a username
  className?: string;
}

interface UserData {
  id: string;
  username: string;
  // Add other user properties as needed
}

const UserInfo: React.FC<UserInfoProps> = ({ userId, className = '' }) => {
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
      <div className="user-avatar">
        {getAvatarText()}
      </div>
      <div className="user-details">
        <span className="user-name">{getDisplayName()}</span>
      </div>
    </div>
  );
};

export default UserInfo;
