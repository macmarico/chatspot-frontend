import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const connect = (serverUrl, authToken = null) => {
    try {
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
      }

      // Create connection options
      const options = {};
      if (authToken) {
        options.auth = { token: authToken };
      }

      // Create new socket connection
      const newSocket = io(serverUrl, options);

      // Set up event listeners
      newSocket.on('connect', () => {
        setConnected(true);
        setError(null);
        console.log('✅ Connected as', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('❌ Disconnected');
      });

      newSocket.on('connect_error', (err) => {
        setError(`Connection error: ${err.message}`);
        console.error('Connection error:', err);
      });

      newSocket.on('message', (data) => {
        console.log('📩 Message received:', data);
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      // Save the socket instance
      setSocket(newSocket);
      return newSocket;
    } catch (err) {
      setError(`Failed to connect: ${err.message}`);
      console.error('Failed to connect:', err);
      return null;
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  };

  const sendMessage = (receiverId, messageText) => {
    if (!socket || !connected) {
      setError('Cannot send message: Not connected');
      return false;
    }

    try {
      socket.emit('message', {
        receiver_id: receiverId,
        message: messageText,
      });
      return true;
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      return false;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    socket,
    connected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
