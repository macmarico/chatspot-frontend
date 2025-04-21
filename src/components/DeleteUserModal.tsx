import React from 'react';
import './DeleteUserModal.css';

interface DeleteUserModalProps {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  username?: string;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ onClose, onConfirm, loading, username }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete User</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="warning-text">
            Are you sure you want to delete this user from your contacts?
          </p>
          <p className="info-text">
            This will permanently delete all messages and remove all traces of your conversation with {username || 'this user'}.
            This action cannot be undone and will also remove you from their contacts.
          </p>
        </div>

        <div className="modal-footer">
          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="delete-button"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
