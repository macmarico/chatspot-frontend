import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import socketReducer from './slices/socketSlice';
import authReducer from './slices/authSlice';
import chatDBReducer from './slices/chatDBSlice';
import typingReducer from './slices/typingSlice';
import rootSaga from './sagas/rootSaga';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
const store = configureStore({
  reducer: {
    socket: socketReducer,
    auth: authReducer,
    chatDB: chatDBReducer,
    typing: typingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true, // Enable thunks for chatDB async operations
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['socket/connectSuccess'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: ['socket.socket'],
      },
    }).concat(sagaMiddleware),
});

// Run the root saga
sagaMiddleware.run(rootSaga);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
