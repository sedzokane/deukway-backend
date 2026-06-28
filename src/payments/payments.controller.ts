import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('invoice')
  @UseGuards(JwtAuthGuard)
  async createInvoice(
    @Request() req,
    @Body() body: { amount: number; description: string; returnUrl: string; channel?: string },
  ) {
    return this.paymentsService.createInvoice(
      req.user.userId,
      body.amount,
      body.description,
      body.returnUrl,
      body.channel,
    );
  }

  @Get('check/:token')
  @UseGuards(JwtAuthGuard)
  async checkInvoice(@Param('token') token: string) {
    return this.paymentsService.checkInvoice(token);
  }

  @Get('success')
  async paymentSuccess(@Query('token') token: string) {
    console.log('Payment success, token:', token);
    return { message: 'Paiement recu', token: token };
  }

  @Post('ipn')
  async ipn(@Body() body: any) {
    console.log('IPN received:', JSON.stringify(body));
    return { message: 'ok' };
  }
}