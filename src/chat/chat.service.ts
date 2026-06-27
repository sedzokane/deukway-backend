import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(senderId: string, receiverId: string, content: string, type: string = 'text') {
    const message = await this.prisma.message.create({
      data: { senderId, receiverId, content, type },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
    return message;
  }

  async getConversation(userId1: string, userId2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Set();
    const conversations = [];
    messages.forEach(function(m) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const other = m.senderId === userId ? m.receiver : m.sender;
        conversations.push({
          user: other,
          lastMessage: m,
          unread: 0,
        });
      }
    });
    return conversations;
  }

  async markAsRead(userId: string, senderId: string) {
    await this.prisma.message.updateMany({
      where: { senderId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}