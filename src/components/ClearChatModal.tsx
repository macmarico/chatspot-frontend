import React from 'react';
import './ClearChatModal.css';

interface ClearChatModalProps {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const ClearChatModal: React.FC<ClearChatModalProps> = ({ onClose, onConfirm, loading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Clear Chat</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="warning-text">
            Are you sure you want to clear all messages in this chat?
          </p>
          <p className="info-text">
            This will delete all messages for both you and the other person. This action cannot be undone.
          </p>
        </div>
        
        <div className="modal-actions">
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
            className="clear-chat-button" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Clearing...' : 'Clear Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearChatModal;
