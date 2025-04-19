import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './ConnectionForm.css';

const ConnectionForm = () => {
  const { connect, disconnect, connected, error } = useSocket();
  const [serverUrl, setServerUrl] = useState('ws://localhost:3000');
  const [authToken, setAuthToken] = useState('');
  const [showAuthToken, setShowAuthToken] = useState(false);

  const handleConnect = (e) => {
    e.preventDefault();
    connect(serverUrl, authToken || null);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="connection-form">
      <h2>Connection</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleConnect}>
        <div className="form-group">
          <label htmlFor="server-url">Server URL:</label>
          <input
            id="server-url"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            disabled={connected}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="auth-token">Authentication Token (optional):</label>
          <div className="token-input">
            <input
              id="auth-token"
              type={showAuthToken ? 'text' : 'password'}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              disabled={connected}
              placeholder="JWT or other auth token"
            />
            <button 
              type="button" 
              className="toggle-visibility"
              onClick={() => setShowAuthToken(!showAuthToken)}
            >
              {showAuthToken ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          {!connected ? (
            <button type="submit" className="connect-button">Connect</button>
          ) : (
            <button 
              type="button" 
              className="disconnect-button"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
      
      {connected && (
        <div className="connection-status connected">
          ✅ Connected
        </div>
      )}
    </div>
  );
};

export default ConnectionForm;
