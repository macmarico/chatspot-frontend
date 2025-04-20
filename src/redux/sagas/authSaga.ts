import { call, put, takeLatest } from 'redux-saga/effects';
import { authService } from '../../services/api';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure
} from '../slices/authSlice';
import { connectRequest } from '../slices/socketSlice';
import { PayloadAction } from '@reduxjs/toolkit';

interface AuthPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  [key: string]: any;
}

// Worker saga for login
function* loginSaga(action: PayloadAction<AuthPayload>) {
  try {
    const { username, password } = action.payload;
    
    // Call the login API
    const response: AuthResponse = yield call(authService.login, username, password);
    
    // Dispatch success action with the token
    yield put(loginSuccess({ 
      access_token: response.access_token,
      username
    }));
    
    // Connect to socket with the token
    yield put(connectRequest({ authToken: response.access_token }));
    
  } catch (error: any) {
    // Dispatch failure action with error message
    yield put(loginFailure(error.toString()));
  }
}

// Worker saga for register
function* registerSaga(action: PayloadAction<AuthPayload>) {
  try {
    const { username, password } = action.payload;
    
    // Call the register API
    const response: AuthResponse = yield call(authService.register, username, password);
    
    // Dispatch success action with the token
    yield put(registerSuccess({ 
      access_token: response.access_token,
      username
    }));
    
    // Connect to socket with the token
    yield put(connectRequest({ authToken: response.access_token }));
    
  } catch (error: any) {
    // Dispatch failure action with error message
    yield put(registerFailure(error.toString()));
  }
}

// Watcher saga for auth actions
export function* authSaga() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(registerRequest.type, registerSaga);
}
