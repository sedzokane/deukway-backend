import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyListings(@Request() req) {
    return this.listingsService.getMyListings(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.listingsService.findOne(id, req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body: any) {
    return this.listingsService.create(req.user.userId, body);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  toggleStatus(@Param('id') id: string, @Request() req) {
    return this.listingsService.toggleStatus(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.listingsService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.listingsService.remove(id, req.user.userId);
  }
}