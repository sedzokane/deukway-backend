import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getMyFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
            media: { orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map(f => ({ ...f.listing, isFavorite: true }));
  }

  async toggle(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return { isFavorite: false, message: 'Retiré des favoris' };
    }

    await this.prisma.favorite.create({ data: { userId, listingId } });
    return { isFavorite: true, message: 'Ajouté aux favoris' };
  }
}