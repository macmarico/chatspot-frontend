import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import { userService } from '../services/userService';
import './NewChatModal.css';

interface NewChatModalProps {
  onClose: () => void;
  onStartChat: (username: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onStartChat }) => {
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Get current user's username
  const currentUsername = useSelector(selectUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    // Check if user is trying to chat with themselves
    if (trimmedUsername.toLowerCase() === currentUsername?.toLowerCase()) {
      setError('You cannot start a chat with yourself');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // No need to resolve username to userId anymore
      onStartChat(trimmedUsername);
    } catch (err: any) {
      setError(err.toString() || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Start New Chat</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Enter Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter the username to chat with"
              autoFocus
              disabled={loading}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="start-chat-button" disabled={loading}>
              {loading ? 'Finding User...' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;
