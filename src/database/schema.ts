import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Define the database schema
export const schema = appSchema({
  version: 1,
  tables: [
    // Chats table - stores individual messages
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string', isIndexed: true },
        { name: 'receiver_id', type: 'string', isIndexed: true },
        { name: 'message', type: 'string' },
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
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'last_msg', type: 'string' },
        { name: 'updated', type: 'number', isIndexed: true }
      ]
    })
  ]
});
