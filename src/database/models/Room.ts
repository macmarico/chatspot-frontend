import { Model, Q } from '@nozbe/watermelondb';
import { field, date, text, children } from '@nozbe/watermelondb/decorators';
import { Chat } from './Chat';

export class Room extends Model {
  static table = 'rooms';
  
  @text('room_id') roomId!: string;
  @text('user_id') userId!: string;
  @text('last_msg') lastMsg!: string;
  @date('updated') updated!: number;
  
  // Relation to Chats
  @children('chats') chats!: any;
  
  // Get all messages for this room
  async getMessages(): Promise<Chat[]> {
    return await this.chats.query(
      Q.where('room_id', this.roomId),
      Q.sortBy('timestamp', Q.asc)
    ).fetch();
  }
  
  // Get the latest message
  async getLatestMessage(): Promise<Chat | null> {
    const messages = await this.chats.query(
      Q.where('room_id', this.roomId),
      Q.sortBy('timestamp', Q.desc),
      Q.take(1)
    ).fetch();
    
    return messages[0] || null;
  }
  
  // Convert to a plain object for Redux
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      room_id: this.roomId,
      user_id: this.userId,
      last_msg: this.lastMsg,
      updated: this.updated,
    };
  }
}
