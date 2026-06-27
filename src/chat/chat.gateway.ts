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
      console.log('Client connected:', payload.sub);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.data.userId);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const roomId = this.getRoomId(client.data.userId, data.receiverId);
    client.join(roomId);
    return { event: 'joined', roomId };
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

  private getRoomId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}