import { database, getRoomId } from './config';
import { Q } from '@nozbe/watermelondb';
import { Chat, MessageType } from './models/Chat';
import { Room } from './models/Room';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Get collections
const chatsCollection = database.get<Chat>('chats');
const roomsCollection = database.get<Room>('rooms');

// Database service for chat operations
export const chatDBService = {
  // Initialize the database
  initialize: async (): Promise<boolean> => {
    try {
      // Perform a simple write operation to ensure the database is working
      await database.write(async () => {
        // Just check if we can access the collections
        const chats = await chatsCollection.query().fetch();
        const rooms = await roomsCollection.query().fetch();
        console.log('Database initialized with', chats.length, 'chats and', rooms.length, 'rooms');
      });
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return false;
    }
  },

  // Get or create a room
  getOrCreateRoom: async (currentUserId: string, otherUserId: string): Promise<Room> => {
    try {
      const roomId = getRoomId(currentUserId, otherUserId);

      // Check if room exists
      const existingRoom = await roomsCollection.query(
        Q.where('room_id', roomId),
        Q.where('user_id', otherUserId)
      ).fetch();

      if (existingRoom.length > 0) {
        return existingRoom[0];
      }

      // Create new room using database.write
      const newRoom = await database.write(async () => {
        return await roomsCollection.create(room => {
          room.roomId = roomId;
          room.userId = otherUserId;
          room.lastMsg = '';
          room.updated = Date.now();
        });
      });

      return newRoom;
    } catch (error) {
      console.error('Failed to get or create room:', error);
      throw error;
    }
  },

  // Save a new message with type
  saveMessage: async (
    senderId: string,
    receiverId: string,
    message: string,
    isMine: boolean = true,
    type: MessageType = 'text' // Default type is text
  ): Promise<Chat> => {
    try {
      const roomId = getRoomId(senderId, receiverId);
      const timestamp = Date.now();

      // Use database.write to perform all operations in a single transaction
      const chatMessage = await database.write(async () => {
        // Create the message
        const chatMessage = await chatsCollection.create(chat => {
          chat.roomId = roomId;
          chat.senderId = senderId;
          chat.receiverId = receiverId;
          chat.message = message;
          chat.type = type;
          chat.timestamp = timestamp;
          chat.status = 'sent';
          chat.isMine = isMine;
        });

        // Only update room for regular text messages
        if (type === 'text') {
          // Update or create the room
          const rooms = await roomsCollection.query(
            Q.where('room_id', roomId),
            Q.where('user_id', isMine ? receiverId : senderId)
          ).fetch();

          if (rooms.length > 0) {
            await rooms[0].update(room => {
              room.lastMsg = message;
              room.updated = timestamp;
            });
          } else {
            await roomsCollection.create(room => {
              room.roomId = roomId;
              room.userId = isMine ? receiverId : senderId;
              room.lastMsg = message;
              room.updated = timestamp;
            });
          }
        }

        return chatMessage;
      });

      return chatMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  },

  // Get all messages for a room
  getMessages: async (userId1: string, userId2: string): Promise<Record<string, any>[]> => {
    try {
      const roomId = getRoomId(userId1, userId2);

      const messages = await chatsCollection.query(
        Q.where('room_id', roomId),
        Q.sortBy('timestamp', Q.asc)
      ).fetch();

      return messages.map(message => message.toJSON());
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  // Observe messages for a room (reactive)
  observeMessages: (userId1: string, userId2: string): Observable<Record<string, any>[]> => {
    const roomId = getRoomId(userId1, userId2);

    return chatsCollection.query(
      Q.where('room_id', roomId),
      Q.sortBy('timestamp', Q.asc)
    ).observe()
    .pipe(
      map(messages => messages.map(message => message.toJSON()))
    );
  },

  // Get all rooms for a user
  getRooms: async (userId: string): Promise<Record<string, any>[]> => {
    try {
      const rooms = await roomsCollection.query(
        Q.or(
          Q.where('user_id', userId),
          Q.where('room_id', Q.like(`%${userId}%`))
        ),
        Q.sortBy('updated', Q.desc)
      ).fetch();

      return rooms.map(room => room.toJSON());
    } catch (error) {
      console.error('Failed to get rooms:', error);
      return [];
    }
  },

  // Observe rooms for a user (reactive)
  observeRooms: (userId: string): Observable<Record<string, any>[]> => {
    return roomsCollection.query(
      Q.or(
        Q.where('user_id', userId),
        Q.where('room_id', Q.like(`%${userId}%`))
      ),
      Q.sortBy('updated', Q.desc)
    ).observe()
    .pipe(
      map(rooms => rooms.map(room => room.toJSON()))
    );
  },

  // Update message status
  updateMessageStatus: async (messageId: string, status: string): Promise<boolean> => {
    try {
      const message = await chatsCollection.find(messageId);

      await database.write(async () => {
        await message.update(msg => {
          msg.status = status;
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to update message status:', error);
      return false;
    }
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<boolean> => {
    try {
      const message = await chatsCollection.find(messageId);

      await database.write(async () => {
        await message.destroyPermanently();
      });

      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  },

  // Delete all messages in a room and update room info
  clearRoom: async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      const roomId = getRoomId(userId1, userId2);

      const messages = await chatsCollection.query(
        Q.where('room_id', roomId)
      ).fetch();

      // Find all rooms associated with this conversation
      const rooms = await roomsCollection.query(
        Q.where('room_id', roomId)
      ).fetch();

      await database.write(async () => {
        // Delete all messages
        for (const message of messages) {
          await message.destroyPermanently();
        }

        // Update all rooms to show they've been cleared
        for (const room of rooms) {
          await room.update(roomRecord => {
            roomRecord.lastMsg = 'Chat cleared'; // Update the last message
            roomRecord.updated = Date.now(); // Update the timestamp
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to clear room:', error);
      return false;
    }
  },

  // Delete a user room completely (remove all messages and room entries)
  deleteUserRoom: async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      const roomId = getRoomId(userId1, userId2);

      // Find all messages in this room
      const messages = await chatsCollection.query(
        Q.where('room_id', roomId)
      ).fetch();

      // Find all rooms associated with this conversation
      const rooms = await roomsCollection.query(
        Q.where('room_id', roomId)
      ).fetch();

      await database.write(async () => {
        // Delete all messages
        for (const message of messages) {
          await message.destroyPermanently();
        }

        // Delete all room entries
        for (const room of rooms) {
          await room.destroyPermanently();
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete user room:', error);
      return false;
    }
  },

  // Send a clear chat message and update room info
  sendClearChatMessage: async (senderId: string, receiverId: string): Promise<Chat> => {
    try {
      const roomId = getRoomId(senderId, receiverId);

      // Find all rooms associated with this conversation
      const rooms = await roomsCollection.query(
        Q.where('room_id', roomId)
      ).fetch();

      // Update room info in the same transaction
      await database.write(async () => {
        // Update all rooms to show they've been cleared
        for (const room of rooms) {
          await room.update(roomRecord => {
            roomRecord.lastMsg = 'Chat cleared'; // Update the last message
            roomRecord.updated = Date.now(); // Update the timestamp
          });
        }
      });

      // Create a special clear_chat message
      return await chatDBService.saveMessage(
        senderId,
        receiverId,
        'Chat cleared',
        true,
        'clear_chat'
      );
    } catch (error) {
      console.error('Failed to send clear chat message:', error);
      throw error;
    }
  },

  // Send a typing indicator message - doesn't actually save to database
  sendTypingIndicator: async (senderId: string, receiverId: string, isTyping: boolean): Promise<any> => {
    try {
      // Just return a mock object with the typing information
      // We don't want to save typing indicators to the database
      return {
        id: 'typing_' + Date.now(),
        roomId: getRoomId(senderId, receiverId),
        senderId: senderId,
        receiverId: receiverId,
        message: isTyping ? 'typing' : 'stopped_typing',
        type: 'typing',
        timestamp: Date.now(),
        status: 'sent',
        isMine: true
      };
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
      throw error;
    }
  }
};
