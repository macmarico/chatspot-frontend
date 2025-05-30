import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { getWsUrl } from '../../utils/env';

interface Message {
  sender_id?: string; // Kept for backward compatibility
  receiver_id?: string; // Kept for backward compatibility
  sender_username?: string;
  receiver_username?: string;
  message?: string;
  type?: 'text' | 'clear_chat' | 'typing' | 'delete_user'; // Add message type
  timestamp?: number;
  [key: string]: any;
}

interface SocketState {
  socket: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  serverUrl: string;
  authToken: string;
  messages: Message[];
}

interface ConnectRequestPayload {
  serverUrl?: string;
  authToken?: string | null;
}

interface ConnectSuccessPayload {
  socketId: string;
}

interface SendMessageRequestPayload {
  receiverUsername: string;
  messageText: string;
  messageType?: 'text' | 'clear_chat' | 'typing' | 'delete_user';
}

// Get WebSocket URL from environment utility
const WS_URL = getWsUrl();

const initialState: SocketState = {
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  serverUrl: WS_URL,
  authToken: '',
  messages: []
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection actions
    connectRequest: (state, action: PayloadAction<ConnectRequestPayload | undefined>) => {
      state.connecting = true;
      state.error = null;
      if (action.payload) {
        if (action.payload.serverUrl) {
          state.serverUrl = action.payload.serverUrl;
        }
        if (action.payload.authToken !== undefined) {
          state.authToken = action.payload.authToken || '';
        }
      }
    },
    connectSuccess: (state, action: PayloadAction<ConnectSuccessPayload>) => {
      state.socket = action.payload.socketId;
      state.connected = true;
      state.connecting = false;
      state.error = null;
    },
    connectFailure: (state, action: PayloadAction<string>) => {
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
    sendMessageRequest: (state, action: PayloadAction<SendMessageRequestPayload>) => {
      // No state changes needed here, the saga will handle sending
    },
    sendMessageSuccess: (state) => {
      // Optionally, you could add the sent message to a "sentMessages" array
    },
    sendMessageFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    messageReceived: (state, action: PayloadAction<Message>) => {
      // Don't add typing indicators or old-style clear chat messages to the messages list
      if (action.payload.type !== 'typing' && action.payload.message !== '__CLEAR_CHAT__') {
        state.messages.push(action.payload);
      }
    },

    // Error handling
    setError: (state, action: PayloadAction<string>) => {
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
export const selectSocket = (state: RootState) => state.socket.socket;
export const selectConnected = (state: RootState) => state.socket.connected;
export const selectConnecting = (state: RootState) => state.socket.connecting;
export const selectError = (state: RootState) => state.socket.error;
export const selectServerUrl = (state: RootState) => state.socket.serverUrl;
export const selectAuthToken = (state: RootState) => state.socket.authToken;
export const selectMessages = (state: RootState) => state.socket.messages;

// Export reducer
export default socketSlice.reducer;
