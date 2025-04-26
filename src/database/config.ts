import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { schema } from './schema';
import { Chat } from './models/Chat';
import { Room } from './models/Room';

// Create the adapter
const adapter = new LokiJSAdapter({
  schema,
  // Use LokiJS in-memory adapter for the browser environment
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  // For development, you might want to enable this for debugging
  dbName: 'chatspotDB',
  // Optional, but recommended for better performance with larger datasets
  onQuotaExceededError: error => {
    console.warn('Storage quota exceeded', error);
  },
  // Optional, but recommended for debugging
  onSetUpError: error => {
    console.error('Database setup error:', error);
  }
});

// Set a custom ID generator to ensure consistent IDs
setGenerator(() => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
});

// Create the database with the adapter
export const database = new Database({
  adapter,
  modelClasses: [
    Chat,
    Room
  ],
});

// Helper function to get a room ID from two user identifiers (can be userIds or usernames)
export const getRoomId = (user1: string, user2: string): string => {
  // Sort the IDs alphabetically and join them with an underscore
  return [user1, user2].sort().join('_');
};
