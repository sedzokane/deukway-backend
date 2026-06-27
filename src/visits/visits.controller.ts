import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.visitsService.create(req.user.userId, body);
  }

  @Get('my')
  getMyVisits(@Request() req) {
    return this.visitsService.getMyVisits(req.user.userId);
  }

  @Get('owner')
  getOwnerVisits(@Request() req) {
    return this.visitsService.getOwnerVisits(req.user.userId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.visitsService.updateStatus(id, req.user.userId, body.status);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.visitsService.cancel(id, req.user.userId);
  }
}