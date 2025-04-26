import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface TypingState {
  typingUsers: Record<string, number>; // username -> timestamp
}

const initialState: TypingState = {
  typingUsers: {}
};

const typingSlice = createSlice({
  name: 'typing',
  initialState,
  reducers: {
    setUserTyping: (state, action: PayloadAction<{ userId: string, isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload; // userId is actually username

      if (isTyping) {
        // Set the timestamp when the user started typing
        state.typingUsers[userId] = Date.now();
      } else {
        // Remove the user from typing users
        delete state.typingUsers[userId];
      }
    },

    clearTypingUsers: (state) => {
      state.typingUsers = {};
    }
  }
});

// Export actions
export const { setUserTyping, clearTypingUsers } = typingSlice.actions;

// Export selectors
export const selectTypingUsers = (state: RootState) => state.typing.typingUsers;
export const selectIsUserTyping = (state: RootState, username: string) => {
  const timestamp = state.typing.typingUsers[username];
  if (!timestamp) return false;

  // Consider typing status valid for 5 seconds
  return (Date.now() - timestamp) < 5000;
};

// Export reducer
export default typingSlice.reducer;
