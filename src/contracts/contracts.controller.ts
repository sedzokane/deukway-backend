import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post('visit/:visitId')
  create(@Request() req, @Param('visitId') visitId: string) {
    return this.contractsService.createContract(req.user.userId, visitId);
  }

  @Get()
  getMyContracts(@Request() req) {
    return this.contractsService.getMyContracts(req.user.userId, req.user.role);
  }

  @Get(':id')
  getContract(@Request() req, @Param('id') id: string) {
    return this.contractsService.getContract(id, req.user.userId);
  }

  @Patch(':id/sign')
  sign(@Request() req, @Param('id') id: string) {
    return this.contractsService.signContract(id, req.user.userId);
  }

  @Patch(':id/reject')
  reject(@Request() req, @Param('id') id: string) {
    return this.contractsService.rejectContract(id, req.user.userId);
  }
}