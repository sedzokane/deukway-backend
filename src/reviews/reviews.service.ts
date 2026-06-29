import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('contract/:contractId')
  create(
    @Request() req,
    @Param('contractId') contractId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(req.user.userId, contractId, body.rating, body.comment);
  }

  @Get('user/:userId')
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }

  @Get('mine')
  getMyReviews(@Request() req) {
    return this.reviewsService.getMyReviews(req.user.userId);
  }

  @Get('contract/:contractId')
  getContractReview(@Param('contractId') contractId: string) {
    return this.reviewsService.getContractReview(contractId);
  }
}