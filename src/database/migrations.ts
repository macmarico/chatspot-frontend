import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Define migrations for the database
export const migrations = schemaMigrations({
  migrations: [
    // Initial migration (version 1 to 2) - Add type field
    {
      toVersion: 2,
      steps: [
        // Add type field to chats table
        {
          type: 'add_columns',
          table: 'chats',
          columns: [
            { name: 'type', type: 'string', isIndexed: true }
          ]
        }
      ]
    },
    // Migration to version 3 - Replace IDs with usernames in chats
    {
      toVersion: 3,
      steps: [
        // Add username columns to chats table
        {
          type: 'add_columns',
          table: 'chats',
          columns: [
            { name: 'sender_username', type: 'string', isIndexed: true },
            { name: 'receiver_username', type: 'string', isIndexed: true }
          ]
        }
      ]
    },
    // Migration to version 4 - Add username to rooms
    {
      toVersion: 4,
      steps: [
        // Add username column to rooms table
        {
          type: 'add_columns',
          table: 'rooms',
          columns: [
            { name: 'username', type: 'string', isIndexed: true }
          ]
        }
      ]
    },
    // Migration to version 5 - Remove user ID fields
    {
      toVersion: 5,
      steps: [
        // This is a schema-only migration, as we've removed the fields from the models
        // The database will still have the columns, but they won't be used
        // In a real production app, you would want to create a data migration
        // to ensure all records have username values before removing the ID fields
      ]
    }
  ]
});
