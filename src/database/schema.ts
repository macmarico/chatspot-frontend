import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Define the database schema
export const schema = appSchema({
  version: 5, // Updated version to remove user IDs
  tables: [
    // Chats table - stores individual messages
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'sender_username', type: 'string', isIndexed: true },
        { name: 'receiver_username', type: 'string', isIndexed: true },
        { name: 'message', type: 'string' },
        { name: 'type', type: 'string', isIndexed: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'status', type: 'string' },
        { name: 'is_mine', type: 'boolean' }
      ]
    }),

    // Rooms table - represents active conversations
    tableSchema({
      name: 'rooms',
      columns: [
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'username', type: 'string', isIndexed: true },
        { name: 'last_msg', type: 'string' },
        { name: 'updated', type: 'number', isIndexed: true }
      ]
    })
  ]
});
