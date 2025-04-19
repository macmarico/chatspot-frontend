import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  serverUrl: 'ws://localhost:3000',
  authToken: '',
  messages: []
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection actions
    connectRequest: (state, action) => {
      state.connecting = true;
      state.error = null;
      if (action.payload) {
        if (action.payload.serverUrl) {
          state.serverUrl = action.payload.serverUrl;
        }
        if (action.payload.authToken !== undefined) {
          state.authToken = action.payload.authToken;
        }
      }
    },
    connectSuccess: (state, action) => {
      state.socket = action.payload.socketId;
      state.connected = true;
      state.connecting = false;
      state.error = null;
    },
    connectFailure: (state, action) => {
      state.connected = false;
      state.connecting = false;
      state.error = action.payload;
    },
    disconnectRequest: (state) => {
      // No state changes needed here, the saga will handle disconnection
    },
    disconnectSuccess: (state) => {
      state.socket = null;
      state.connected = false;
    },
    
    // Message actions
    sendMessageRequest: (state, action) => {
      // No state changes needed here, the saga will handle sending
    },
    sendMessageSuccess: (state) => {
      // Optionally, you could add the sent message to a "sentMessages" array
    },
    sendMessageFailure: (state, action) => {
      state.error = action.payload;
    },
    messageReceived: (state, action) => {
      state.messages.push(action.payload);
    },
    
    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

// Export actions
export const {
  connectRequest,
  connectSuccess,
  connectFailure,
  disconnectRequest,
  disconnectSuccess,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  messageReceived,
  setError,
  clearError
} = socketSlice.actions;

// Export selectors
export const selectSocket = (state) => state.socket.socket;
export const selectConnected = (state) => state.socket.connected;
export const selectConnecting = (state) => state.socket.connecting;
export const selectError = (state) => state.socket.error;
export const selectServerUrl = (state) => state.socket.serverUrl;
export const selectAuthToken = (state) => state.socket.authToken;
export const selectMessages = (state) => state.socket.messages;

// Export reducer
export default socketSlice.reducer;
