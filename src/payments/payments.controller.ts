import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('invoice')
  async createInvoice(
    @Request() req,
    @Body() body: { amount: number; description: string; returnUrl: string },
  ) {
    return this.paymentsService.createInvoice(
      req.user.userId,
      body.amount,
      body.description,
      body.returnUrl,
    );
  }

  @Get('check/:token')
  async checkInvoice(@Param('token') token: string) {
    return this.paymentsService.checkInvoice(token);
  }
}