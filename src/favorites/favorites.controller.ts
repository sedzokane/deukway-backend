import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  getMyFavorites(@Request() req) {
    return this.favoritesService.getMyFavorites(req.user.userId);
  }

  @Post(':listingId')
  toggle(@Request() req, @Param('listingId') listingId: string) {
    return this.favoritesService.toggle(req.user.userId, listingId);
  }
}