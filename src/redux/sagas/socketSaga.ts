import { eventChannel, END, EventChannel } from 'redux-saga';
import { call, put, take, takeEvery, fork, cancel, cancelled, select } from 'redux-saga/effects';
import { io, Socket } from 'socket.io-client';
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
          console.log('📩 Message received:', event.data);

          // Handle received message based on type
          try {
            const currentUser: string = yield select(selectUser);
            if (currentUser && event.data.sender_id && event.data.message) {
              // Check message type
              const messageType = event.data.type || 'text';

              switch (messageType) {
                case 'clear_chat':
                  console.log('Received clear chat request from', event.data.sender_id);
                  // Clear the chat in the local database
                  yield call(
                    chatDBService.clearRoom,
                    currentUser,
                    event.data.sender_id
                  );

                  // // Add the clear_chat message to the UI
                  // yield put(messageReceived(event.data));

                  // // Save the clear_chat message to database
                  // yield call(
                  //   chatDBService.saveMessage,
                  //   event.data.sender_id,
                  //   currentUser,
                  //   event.data.message,
                  //   false,
                  //   'clear_chat'
                  // );
                  break;

                case 'typing':
                  // Handle typing indicator - update typing state in Redux
                  console.log('Typing indicator from', event.data.sender_id);
                  // Use the dedicated typing slice instead of messageReceived
                  yield put(setUserTyping({
                    userId: event.data.sender_id,
                    isTyping: event.data.message === 'typing'
                  }));
                  break;

                case 'text':
                default:
                  // Regular text message - save to database and dispatch to UI
                  yield call(
                    chatDBService.saveMessage,
                    event.data.sender_id,
                    currentUser,
                    event.data.message,
                    false,
                    'text'
                  );
                  break;
              }
            }
          } catch (dbError) {
            console.error('Failed to handle received message:', dbError);
          }
          break;
        default:
          break;
      }
    }
  } catch (error: any) {
    console.error('Socket channel error:', error);
  } finally {
    if (yield cancelled()) {
      // Close the channel if the saga was cancelled
      // socketChannel.close();
    }
  }
}

// Saga to handle sending messages
function* sendMessageSaga(action: PayloadAction<{ receiverId: string, messageText: string, messageType?: 'text' | 'clear_chat' | 'typing' }>) {
  try {
    const { receiverId, messageText, messageType = 'text' } = action.payload;

    if (!socket) {
      throw new Error('Cannot send message: Not connected');
    }

    // Create message object with type
    const messageObj = {
      receiver_id: receiverId,
      message: messageText,
      type: messageType,
      // Add metadata for UI display
      sent_by_me: true,
      timestamp: Date.now()
    };

    // Send the message with type field
    socket.emit('message', {
      receiver_id: receiverId,
      message: messageText,
      type: messageType
    });

    // Handle different message types
    switch (messageType) {
      case 'clear_chat':
        console.log('Sending clear chat request to', receiverId);
        try {
          const currentUser: string = yield select(selectUser);
          if (currentUser) {
            // Clear local messages
            yield call(chatDBService.clearRoom, currentUser, receiverId);
          }
        } catch (dbError) {
          console.error('Failed to clear chat:', dbError);
        }
        break;

      case 'typing':
        // Don't save typing indicators to database or add to messages list
        console.log('Sending typing indicator to', receiverId);
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
              receiverId,
              messageText,
              true,
              'text'
            );
          }
        } catch (dbError) {
          console.error('Failed to save message to database:', dbError);
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
    console.error('Disconnect error:', error);
  }
}

// Root socket saga
export function* socketSaga() {
  // Handle socket actions
  yield takeEvery(connectRequest.type, connectSaga);
  yield takeEvery(sendMessageRequest.type, sendMessageSaga);
  yield takeEvery(disconnectRequest.type, disconnectSaga);
}
