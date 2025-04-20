import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  connectRequest,
  disconnectRequest,
  selectConnected,
  selectConnecting,
  selectError,
  selectServerUrl,
  selectAuthToken
} from '../redux/slices/socketSlice';
import './ConnectionForm.css';
import { RootState } from '../redux/store';

const ConnectionForm: React.FC = () => {
  const dispatch = useDispatch();
  const connected = useSelector(selectConnected);
  const connecting = useSelector(selectConnecting);
  const error = useSelector(selectError);
  const storedServerUrl = useSelector(selectServerUrl);
  const storedAuthToken = useSelector(selectAuthToken);

  const [serverUrl, setServerUrl] = useState<string>(storedServerUrl);
  const [authToken, setAuthToken] = useState<string>(storedAuthToken);
  const [showAuthToken, setShowAuthToken] = useState<boolean>(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(connectRequest({ serverUrl, authToken: authToken || null }));
  };

  const handleDisconnect = () => {
    dispatch(disconnectRequest());
  };

  return (
    <div className="connection-form">
      <h2>Server Connection</h2>
      
      {error && (
        <div className="connection-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleConnect}>
        <div className="form-group">
          <label htmlFor="server-url">Server URL:</label>
          <input
            id="server-url"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            disabled={connected || connecting}
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
              disabled={connected || connecting}
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
            <button
              type="submit"
              className="connect-button"
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
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
