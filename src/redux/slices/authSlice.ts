import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface AuthState {
  user: string | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface LoginSuccessPayload {
  access_token: string;
  username: string;
}

const initialState: AuthState = {
  user: localStorage.getItem('auth_username') || null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login actions
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.user = action.payload.username;
      // Store token and username in localStorage for persistence
      localStorage.setItem('auth_token', action.payload.access_token);
      localStorage.setItem('auth_username', action.payload.username);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Register actions
    registerRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.user = action.payload.username;
      // Store token and username in localStorage for persistence
      localStorage.setItem('auth_token', action.payload.access_token);
      localStorage.setItem('auth_username', action.payload.username);
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      // Remove token and username from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  }
});

// Export actions
export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  logout,
  clearError
} = authSlice.actions;

// Export selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Export reducer
export default authSlice.reducer;
