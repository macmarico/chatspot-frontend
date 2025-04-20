import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import './UserInfo.css';

interface UserInfoProps {
  userId: string;
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

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserInfo(userId);
        setUserData(data);
      } catch (err: any) {
        console.error('Failed to fetch user info:', err);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  // Display first letter of username or userId as avatar
  const getAvatarText = () => {
    if (userData?.username) {
      return userData.username.charAt(0).toUpperCase();
    }
    return userId.charAt(0).toUpperCase();
  };

  // Display username if available, otherwise userId
  const getDisplayName = () => {
    if (loading) return 'Loading...';
    if (error) return userId; // Fallback to userId if error
    return userData?.username || userId;
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
