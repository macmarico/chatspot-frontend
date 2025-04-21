import { Model } from '@nozbe/watermelondb';
import { field, relation, date, text } from '@nozbe/watermelondb/decorators';

// Define message types
export type MessageType = 'text' | 'clear_chat' | 'typing';

export class Chat extends Model {
  static table = 'chats';

  @text('room_id') roomId!: string;
  @text('sender_id') senderId!: string;
  @text('receiver_id') receiverId!: string;
  @text('message') message!: string;
  @text('type') type!: MessageType;
  @date('timestamp') timestamp!: number;
  @text('status') status!: string;
  @field('is_mine') isMine!: boolean;

  // Helper methods
  getFormattedTime(): string {
    return new Date(this.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Convert to a plain object for Redux
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      room_id: this.roomId,
      sender_id: this.senderId,
      receiver_id: this.receiverId,
      message: this.message,
      type: this.type,
      timestamp: this.timestamp,
      status: this.status,
      is_mine: this.isMine,
    };
  }
}
