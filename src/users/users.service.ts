import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        city: true,
        isVerified: true,
        isPremium: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        city: true,
        isVerified: true,
        isPremium: true,
        isActive: true,
        createdAt: true,
        listings: {
          where: { isActive: true },
          take: 5,
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        city: true,
        isVerified: true,
        isPremium: true,
        isActive: true,
      },
    });
  }

  async verify(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isVerified: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Compte desactive' };
  }
}