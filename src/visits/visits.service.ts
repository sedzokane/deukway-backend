import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, data: any) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const visit = await this.prisma.visit.create({
      data: {
        tenantId,
        ownerId: listing.ownerId,
        listingId: data.listingId,
        date: new Date(data.date),
        message: data.message,
      },
      include: {
        listing: { include: { media: { take: 1 } } },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await this.notifications.sendPushNotification(
      listing.ownerId,
      'Nouvelle demande de visite',
      `${visit.tenant.firstName} ${visit.tenant.lastName} veut visiter votre bien`,
      { type: 'visit', visitId: visit.id },
    );

    return visit;
  }

  async getMyVisits(tenantId: string) {
    return this.prisma.visit.findMany({
      where: { tenantId },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: 'asc' }, take: 1 },
            owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getOwnerVisits(ownerId: string) {
    return this.prisma.visit.findMany({
      where: { ownerId },
      include: {
        listing: { include: { media: { take: 1 } } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        listing: { select: { title: true } },
      },
    });
    if (!visit) throw new NotFoundException('Visite introuvable');
    if (visit.ownerId !== userId) throw new ForbiddenException('Acces refuse');

    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status: status as any },
      include: {
        listing: { include: { media: { take: 1 } } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    const msg = status === 'CONFIRMED'
      ? `Votre visite pour "${visit.listing.title}" a ete confirmee`
      : `Votre visite pour "${visit.listing.title}" a ete refusee`;

    await this.notifications.sendPushNotification(
      visit.tenantId,
      status === 'CONFIRMED' ? 'Visite confirmee ✓' : 'Visite refusee',
      msg,
      { type: 'visit_status', visitId: id, status },
    );

    return updated;
  }

  async cancel(id: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visite introuvable');
    if (visit.tenantId !== userId && visit.ownerId !== userId) {
      throw new ForbiddenException('Acces refuse');
    }
    return this.prisma.visit.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}