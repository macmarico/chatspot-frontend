import { eventChannel, END, EventChannel } from 'redux-saga';
import { call, put, take, takeEvery, fork, cancel, cancelled, select } from 'redux-saga/effects';
import { io, Socket } from 'socket.io-client';
import { debugLog, isDevelopment } from '../../utils/env';
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
import { selectUser } from '../slices/authSlice';
import { setUserTyping } from '../slices/typingSlice';
import { clearCurrentReceiver } from '../slices/chatDBSlice';
import { PayloadAction } from '@reduxjs/toolkit';
import { chatDBService } from '../../database/service';

// Socket instance that will be shared across sagas
let socket: Socket;

// Create a channel for socket events
function createSocketChannel(socket: Socket) {
  return eventChannel(emit => {
    // Handle connect event
    socket.on('connect', () => {
      emit({ type: 'connect', socketId: socket.id });
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
      emit({ type: 'disconnect' });
    });

    // Handle error event
    socket.on('connect_error', (error) => {
      emit({ type: 'error', error });
    });

    // Handle message event - now with message types
    socket.on('message', (data) => {
      // Ensure data has a type field, default to 'text' if not specified
      if (!data.type) {
        data.type = 'text';
      }
      emit({ type: 'message', data });
    });

    // Return unsubscribe function
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('message');
    };
  });
}

// Saga to handle socket connection
function* connectSaga() {
  try {
    // Get connection details from state
    const serverUrl: string = yield select(selectServerUrl);
    const authToken: string = yield select(selectAuthToken);

    // Create connection options
    const options: any = {};
    if (authToken) {
      options.auth = { token: authToken };
    }

    // Close existing socket if any
    if (socket) {
      socket.disconnect();
    }

    // Connect to the server
    socket = io(serverUrl, options);

    // Create a channel for socket events
    const socketChannel: EventChannel<any> = yield call(createSocketChannel, socket);

    // Process events from the channel
    while (true) {
      const event = yield take(socketChannel);

      // Handle different event types
      switch (event.type) {
        case 'connect':
          yield put(connectSuccess({ socketId: event.socketId }));
          debugLog('✅ Connected as', event.socketId);
          break;
        case 'disconnect':
          debugLog('❌ Disconnected');
          break;
        case 'error':
          yield put(connectFailure(event.error.message || 'Connection error'));
          debugLog('Connection error:', event.error);
          break;
        case 'message':
          debugLog('📩 Message received:', event.data);

          // Handle received message based on type
          try {
            const currentUser: string = yield select(selectUser);
            // Get sender username from data, fallback to sender_id for backward compatibility
            const senderUsername = event.data.sender_username || event.data.sender_id;

            if (currentUser && senderUsername && event.data.message) {
              // Check message type
              const messageType = event.data.type || 'text';

              switch (messageType) {
                case 'clear_chat':
                  debugLog('Received clear chat request from', senderUsername);
                  // Clear the chat in the local database and update room info
                  yield call(
                    chatDBService.clearRoom,
                    currentUser,
                    senderUsername
                  );

                  // Save the clear_chat message to database and update room info
                  yield call(
                    chatDBService.sendClearChatMessage,
                    senderUsername,
                    currentUser
                  );
                  break;

                case 'delete_user':
                  debugLog('Received delete user request from', senderUsername);
                  // Delete the user room completely
                  yield call(
                    chatDBService.deleteUserRoom,
                    currentUser,
                    senderUsername
                  );

                  // Clear the current receiver to close the chat window
                  yield put(clearCurrentReceiver());
                  break;

                case 'typing':
                  // Handle typing indicator - update typing state in Redux
                  debugLog('Typing indicator from', senderUsername);
                  // Use the dedicated typing slice instead of messageReceived
                  yield put(setUserTyping({
                    userId: senderUsername,
                    isTyping: event.data.message === 'typing'
                  }));
                  break;

                case 'text':
                default:
                  // Regular text message - save to database and dispatch to UI
                  yield call(
                    chatDBService.saveMessage,
                    event.data.sender_username || event.data.sender_id, // Prefer username but fallback to ID for compatibility
                    currentUser,
                    event.data.message,
                    false,
                    'text'
                  );
                  break;
              }
            }
          } catch (dbError) {
            debugLog('Failed to handle received message:', dbError);
          }
          break;
        default:
          break;
      }
    }
  } catch (error: any) {
    debugLog('Socket channel error:', error);
  } finally {
    if (yield cancelled()) {
      // Close the channel if the saga was cancelled
      // socketChannel.close();
    }
  }
}

// Saga to handle sending messages
function* sendMessageSaga(action: PayloadAction<{ receiverUsername: string, messageText: string, messageType?: 'text' | 'clear_chat' | 'typing' | 'delete_user' }>) {
  try {
    const { receiverUsername, messageText, messageType = 'text' } = action.payload;

    if (!socket) {
      throw new Error('Cannot send message: Not connected');
    }

    // Get current user (now this is a username, not a userId)
    const currentUser: string = yield select(selectUser);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Send the message with type field
    socket.emit('message', {
      receiver_username: receiverUsername, // Using the proper field name
      sender_username: currentUser, // Add sender username explicitly
      message: messageText,
      type: messageType
    });

    // Handle different message types
    switch (messageType) {
      case 'clear_chat':
        debugLog('Sending clear chat request to', receiverUsername);
        try {
          const currentUser: string = yield select(selectUser);
          if (currentUser) {
            // Clear local messages and update room info
            yield call(chatDBService.clearRoom, currentUser, receiverUsername);

            // Send a clear chat message (this will also update room info)
            yield call(
              chatDBService.sendClearChatMessage,
              currentUser,
              receiverUsername
            );
          }
        } catch (dbError) {
          debugLog('Failed to clear chat:', dbError);
        }
        break;

      case 'delete_user':
        debugLog('Sending delete user request to', receiverUsername);
        try {
          const currentUser: string = yield select(selectUser);
          if (currentUser) {
            // Delete the user room completely
            yield call(chatDBService.deleteUserRoom, currentUser, receiverUsername);

            // Clear the current receiver to close the chat window
            yield put(clearCurrentReceiver());
          }
        } catch (dbError) {
          debugLog('Failed to delete user room:', dbError);
        }
        break;

      case 'typing':
        // Don't save typing indicators to database or add to messages list
        debugLog('Sending typing indicator to', receiverUsername);
        // Update our own typing state for consistency
        const currentUser: string = yield select(selectUser);
        if (currentUser) {
          yield put(setUserTyping({
            userId: currentUser,
            isTyping: messageText === 'typing'
          }));
        }
        // No need to save to database or dispatch to messageReceived
        break;

      case 'text':
      default:
        // Add regular text message to our messages list
        // yield put(messageReceived(messageObj));

        // Save regular message to database
        try {
          const currentUser: string = yield select(selectUser);
          if (currentUser) {
            yield call(
              chatDBService.saveMessage,
              currentUser,
              receiverUsername,
              messageText,
              true,
              'text'
            );
          }
        } catch (dbError) {
          debugLog('Failed to save message to database:', dbError);
        }
        break;
    }

    // Dispatch success action
    yield put(sendMessageSuccess());

  } catch (error: any) {
    // Handle send errors
    yield put(sendMessageFailure(error.message || 'Failed to send message'));
  }
}

// Saga to handle disconnection
function* disconnectSaga() {
  try {
    if (socket) {
      socket.disconnect();
    }
    yield put(disconnectSuccess());
  } catch (error: any) {
    debugLog('Disconnect error:', error);
  }
}

// Root socket saga
export function* socketSaga() {
  // Handle socket actions
  yield takeEvery(connectRequest.type, connectSaga);
  yield takeEvery(sendMessageRequest.type, sendMessageSaga);
  yield takeEvery(disconnectRequest.type, disconnectSaga);
}
