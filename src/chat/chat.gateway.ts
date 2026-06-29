import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private notifications: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join('user_' + payload.sub);
      this.onlineUsers.set(payload.sub, client.id);
      this.server.emit('user_online', { userId: payload.sub });
      console.log('Client connected:', payload.sub, 'Online:', this.onlineUsers.size);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
      console.log('Client disconnected:', userId);
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const roomId = this.getRoomId(client.data.userId, data.receiverId);
    client.join(roomId);
    const isOnline = this.onlineUsers.has(data.receiverId);
    client.emit('user_status', { userId: data.receiverId, online: isOnline });
    return { event: 'joined', roomId };
  }

  @SubscribeMessage('get_online_status')
  handleGetOnlineStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const isOnline = this.onlineUsers.has(data.userId);
    // Emit directement au client au lieu de return
    client.emit('get_online_status', { userId: data.userId, online: isOnline });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string; type?: string },
  ) {
    const message = await this.chatService.createMessage(
      client.data.userId,
      data.receiverId,
      data.content,
      data.type || 'text',
    );
    const roomId = this.getRoomId(client.data.userId, data.receiverId);
    this.server.to(roomId).emit('new_message', message);
    this.server.to('user_' + data.receiverId).emit('notification', {
      type: 'message',
      message,
    });

    await this.notifications.sendPushNotification(
      data.receiverId,
      `${message.sender.firstName} ${message.sender.lastName}`,
      data.type === 'image' ? '📷 Photo' : data.type === 'video' ? '🎥 Video' : data.content,
      { type: 'message', senderId: client.data.userId },
    );

    return message;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string },
  ) {
    await this.chatService.markAsRead(client.data.userId, data.senderId);
    const roomId = this.getRoomId(client.data.userId, data.senderId);
    this.server.to(roomId).emit('messages_read', { userId: client.data.userId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const roomId = this.getRoomId(client.data.userId, data.receiverId);
    client.to(roomId).emit('user_typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  private getRoomId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}