import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const {
      type, city, neighborhood, minPrice, maxPrice,
      isFurnished, hasWifi, hasElectricity, hasWater,
      hasParking, hasAC, page = 1, limit = 10,
    } = query;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (minPrice || maxPrice) where.price = {};
    if (minPrice) where.price.gte = parseInt(minPrice);
    if (maxPrice) where.price.lte = parseInt(maxPrice);
    if (isFurnished === 'true') where.isFurnished = true;
    if (hasWifi === 'true') where.hasWifi = true;
    if (hasElectricity === 'true') where.hasElectricity = true;
    if (hasWater === 'true') where.hasWater = true;
    if (hasParking === 'true') where.hasParking = true;
    if (hasAC === 'true') where.hasAC = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phone: true, avatar: true } },
          media: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  async findOne(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, avatar: true } },
        media: { orderBy: { order: 'asc' } },
        favorites: userId ? { where: { userId } } : false,
      },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...listing,
      isFavorite: userId ? listing.favorites.length > 0 : false,
    };
  }

  async create(userId: string, data: any) {
    try {
      console.log('Creating listing for user:', userId);
      console.log('Data:', JSON.stringify(data));
      const result = await this.prisma.listing.create({
        data: { ...data, ownerId: userId },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
          media: true,
        },
      });
      console.log('Listing created:', result.id);
      return result;
    } catch(e) {
      console.error('Listing create error:', e.message);
      console.error('Error code:', e.code);
      console.error('Error meta:', JSON.stringify(e.meta));
      throw e;
    }
  }

  async update(id: string, userId: string, data: any) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.ownerId !== userId) throw new ForbiddenException('Acces refuse');

    return this.prisma.listing.update({
      where: { id },
      data,
      include: { media: true },
    });
  }

  async toggleStatus(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.ownerId !== userId) throw new ForbiddenException('Acces refuse');

    return this.prisma.listing.update({
      where: { id },
      data: { isActive: !listing.isActive },
      include: { media: true },
    });
  }

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.ownerId !== userId) throw new ForbiddenException('Acces refuse');

    await this.prisma.listing.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Annonce supprimee' };
  }

  async getMyListings(userId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId: userId },
      include: {
        media: { orderBy: { order: 'asc' } },
        visits: { where: { status: 'PENDING' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}