import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.pushToken) return;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.pushToken,
          title,
          body,
          data: data || {},
          sound: 'default',
          priority: 'high',
        }),
      });
    } catch (e) {
      console.error('Push notification error:', e);
    }
  }

  async sendToMultiple(userIds: string[], title: string, body: string, data?: any) {
    await Promise.all(userIds.map(id => this.sendPushNotification(id, title, body, data)));
  }
}