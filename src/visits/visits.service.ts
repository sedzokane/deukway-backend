import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}

  async create(tenantId: string, data: any) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
      include: { owner: true },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const tenant = await this.prisma.user.findUnique({ where: { id: tenantId } });

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
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    // Push notification
    await this.notifications.sendPushNotification(
      listing.ownerId,
      'Nouvelle demande de visite',
      `${visit.tenant.firstName} ${visit.tenant.lastName} veut visiter votre bien`,
      { type: 'visit', visitId: visit.id },
    );

    // Email au propriétaire
    if (listing.owner.email) {
      this.mail.sendVisiteDemandeOwner(listing.owner, tenant, listing, data.date).catch(function(){});
    }

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
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        listing: { select: { id: true, title: true, neighborhood: true, city: true } },
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

    // Email au locataire si confirmée
    if (status === 'CONFIRMED' && visit.tenant.email) {
      this.mail.sendVisiteConfirmeeTenant(visit.tenant, visit.owner, visit.listing, visit.date.toISOString()).catch(function(){});
    }

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