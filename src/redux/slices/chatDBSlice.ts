import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define types
interface ChatDBState {
  initialized: boolean;
  currentRoomId: string | null;
  currentReceiverUsername: string | null;
}

// Initialize the database directly in the component
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    // Import dynamically to avoid circular dependencies
    const { chatDBService } = await import('../../database/service');
    return await chatDBService.initialize();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

// Initial state
const initialState: ChatDBState = {
  initialized: false,
  currentRoomId: null,
  currentReceiverUsername: null
};

// Create the slice
const chatDBSlice = createSlice({
  name: 'chatDB',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    setCurrentRoom: (state, action: PayloadAction<string>) => {
      state.currentRoomId = action.payload;
    },
    setCurrentReceiver: (state, action: PayloadAction<string>) => {
      state.currentReceiverUsername = action.payload;
    },
    clearCurrentReceiver: (state) => {
      state.currentReceiverUsername = null;
      state.currentRoomId = null;
    }
  }
});

// Export actions
export const { setInitialized, setCurrentRoom, setCurrentReceiver, clearCurrentReceiver } = chatDBSlice.actions;

// Export selectors
export const selectDBInitialized = (state: RootState) => state.chatDB.initialized;
export const selectCurrentRoomId = (state: RootState) => state.chatDB.currentRoomId;
export const selectCurrentReceiverUsername = (state: RootState) => state.chatDB.currentReceiverUsername;

// Export reducer
export default chatDBSlice.reducer;
