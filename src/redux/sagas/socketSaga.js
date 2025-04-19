import { eventChannel, END } from 'redux-saga';
import { call, put, take, takeEvery, fork, cancel, cancelled, select } from 'redux-saga/effects';
import { io } from 'socket.io-client';
import {
  connectRequest,
  connectSuccess,
  connectFailure,
  disconnectRequest,
  disconnectSuccess,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  messageReceived,
  selectServerUrl,
  selectAuthToken
} from '../slices/socketSlice';

// Socket instance that will be shared across sagas
let socket;

// Create an event channel for socket events
function createSocketChannel(socket) {
  return eventChannel(emit => {
    // Connection event handlers
    const connectHandler = () => {
      emit({ type: 'connect', socketId: socket.id });
    };

    const disconnectHandler = () => {
      emit({ type: 'disconnect' });
    };

    const errorHandler = (error) => {
      emit({ type: 'error', error });
    };

    const messageHandler = (data) => {
      emit({ type: 'message', data });
    };

    // Set up event listeners
    socket.on('connect', connectHandler);
    socket.on('disconnect', disconnectHandler);
    socket.on('connect_error', errorHandler);
    socket.on('message', messageHandler);

    // Return unsubscribe function
    return () => {
      // Remove event listeners on unsubscribe
      socket.off('connect', connectHandler);
      socket.off('disconnect', disconnectHandler);
      socket.off('connect_error', errorHandler);
      socket.off('message', messageHandler);
    };
  });
}

// Saga to handle socket connection
function* connectSaga() {
  try {
    // Get connection details from state
    const serverUrl = yield select(selectServerUrl);
    const authToken = yield select(selectAuthToken);

    // Create connection options
    const options = {};
    if (authToken) {
      options.auth = { token: authToken };
    }

    // Close existing socket if any
    if (socket) {
      socket.disconnect();
    }

    // Create new socket connection
    socket = io(serverUrl, options);

    // Create a channel to listen for socket events
    const socketChannel = yield call(createSocketChannel, socket);

    // Start a fork to handle socket events
    const socketTask = yield fork(handleSocketEvents, socketChannel);

    // Wait for disconnect request
    yield take(disconnectRequest.type);

    // Cancel the socket task
    yield cancel(socketTask);

    // Disconnect the socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    // Dispatch disconnect success
    yield put(disconnectSuccess());

  } catch (error) {
    // Handle connection errors
    yield put(connectFailure(error.message || 'Connection failed'));
  } finally {
    if (yield cancelled()) {
      // Clean up if the saga was cancelled
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }
  }
}

// Saga to handle socket events from the channel
function* handleSocketEvents(socketChannel) {
  try {
    while (true) {
      // Take events from the socket channel
      const event = yield take(socketChannel);

      // Handle different event types
      switch (event.type) {
        case 'connect':
          yield put(connectSuccess({ socketId: event.socketId }));
          console.log('✅ Connected as', event.socketId);
          break;
        case 'disconnect':
          console.log('❌ Disconnected');
          break;
        case 'error':
          yield put(connectFailure(event.error.message || 'Connection error'));
          console.error('Connection error:', event.error);
          break;
        case 'message':
          yield put(messageReceived(event.data));
          console.log('📩 Message received:', event.data);
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.error('Socket channel error:', error);
  } finally {
    if (yield cancelled()) {
      // Close the channel if the saga was cancelled
      socketChannel.close();
    }
  }
}

// Saga to handle sending messages
function* sendMessageSaga(action) {
  try {
    const { receiverId, messageText } = action.payload;

    if (!socket) {
      throw new Error('Cannot send message: Not connected');
    }

    // Create message object
    const messageObj = {
      receiver_id: receiverId,
      message: messageText,
      // Add metadata for UI display
      sent_by_me: true,
      timestamp: new Date().toISOString()
    };

    // Send the message
    socket.emit('message', {
      receiver_id: receiverId,
      message: messageText,
    });

    // Add the sent message to our messages list
    yield put(messageReceived(messageObj));

    // Dispatch success action
    yield put(sendMessageSuccess());

  } catch (error) {
    // Handle send errors
    yield put(sendMessageFailure(error.message || 'Failed to send message'));
  }
}

// Root socket saga
export function* socketSaga() {
  // Watch for connection requests
  yield takeEvery(connectRequest.type, connectSaga);

  // Watch for send message requests
  yield takeEvery(sendMessageRequest.type, sendMessageSaga);
}
