import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import './RoomsList.css';
import { RootState } from '../redux/store';
import UserInfo from './UserInfo';
// Import formatDistanceToNow function
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return options?.addSuffix ? 'just now' : 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return options?.addSuffix ? `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago` : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return options?.addSuffix ? `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago` : `${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return options?.addSuffix ? `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago` : `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return options?.addSuffix ? `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago` : `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return options?.addSuffix ? `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago` : `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return options?.addSuffix ? `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago` : `${diffInYears} year${diffInYears !== 1 ? 's' : ''}`;
};

interface Room {
  id: string;
  room_id: string;
  username: string;
  last_msg: string;
  updated: number;
}

type RoomRecord = Record<string, any> | Room;

interface RoomsListProps {
  rooms: RoomRecord[];
  onRoomSelect: (username: string) => void;
  selectedUsername: string | null;
}

const RoomsList: React.FC<RoomsListProps> = ({ rooms = [], onRoomSelect, selectedUsername = null }) => {
  const currentUser = useSelector(selectUser);

  // Format timestamp to a readable date/time
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // Use date-fns to get relative time like "2 days ago"
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (error) {
      return '';
    }
  };

  // Truncate message text if it's too long
  const truncateMessage = (message: string, maxLength: number = 40): string => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="rooms-list">
      {rooms.length === 0 ? (
        <div className="no-rooms">
          <div className="no-rooms-icon">📱</div>
          <p>No conversations yet</p>
          <p className="no-rooms-hint">Start chatting with someone!</p>
        </div>
      ) : (
        <ul className="rooms">
          {rooms.map((room) => (
            <li
              key={room.room_id}
              className={`room-item ${room.username === selectedUsername ? 'selected' : ''} ${room.username === currentUser ? 'self-chat' : ''}`}
              onClick={() => room.username !== currentUser && onRoomSelect(room.username)}
            >
              <div className="room-details">
                <div className="room-header">
                  <UserInfo userId={room.username} className="room-user-info" />
                  <span className="room-time">{formatTime(room.updated)}</span>
                </div>
                <div className="room-last-message">
                  {truncateMessage(room.last_msg)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomsList;
