import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(reviewerId: string, contractId: string, rating: number, comment?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { owner: true, tenant: true },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    if (contract.tenantId !== reviewerId) throw new ForbiddenException('Seul le locataire peut noter');
    if (contract.status !== 'SIGNED') throw new ForbiddenException('Le contrat doit etre signe');
    const existing = await this.prisma.review.findUnique({ where: { contractId } });
    if (existing) throw new ConflictException('Vous avez deja note ce contrat');
    if (rating < 1 || rating > 5) throw new ForbiddenException('La note doit etre entre 1 et 5');
    return this.prisma.review.create({
      data: { rating, comment, reviewerId, reviewedId: contract.ownerId, contractId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        reviewed: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { reviewedId: userId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        contract: { include: { listing: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : 0;
    return { reviews, average, count: reviews.length };
  }

  async getMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        reviewed: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        contract: { include: { listing: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContractReview(contractId: string) {
    return this.prisma.review.findUnique({
      where: { contractId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }
}