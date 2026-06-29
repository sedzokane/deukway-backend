import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
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

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req) {
    return this.paymentsService.getHistory(req.user.userId);
  }

  @Get('check/:token')
  @UseGuards(JwtAuthGuard)
  async checkInvoice(@Param('token') token: string) {
    return this.paymentsService.checkInvoice(token);
  }

  @Get('success')
  async paymentSuccess(@Query('token') token: string, @Res() res: any) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Paiement reussi - Deukway</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:linear-gradient(135deg,#F0FDF4,#ECFDF5); display:flex; align-items:center; justify-content:center; min-height:100vh; }
          .card { background:#fff; border-radius:24px; padding:48px 32px; text-align:center; max-width:420px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.1); }
          .icon { width:96px; height:96px; background:linear-gradient(135deg,#D1FAE5,#A7F3D0); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 28px; font-size:48px; }
          h1 { font-size:26px; font-weight:900; color:#065F46; margin-bottom:12px; }
          .subtitle { color:#059669; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
          p { color:#6B7280; font-size:15px; line-height:1.7; margin-bottom:28px; }
          .token { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; padding:12px 16px; font-size:12px; color:#9CA3AF; word-break:break-all; margin-bottom:32px; font-family:monospace; }
          .token span { display:block; font-size:10px; color:#D1D5DB; margin-bottom:4px; letter-spacing:1px; text-transform:uppercase; }
          .btn { background:linear-gradient(135deg,#059669,#047857); color:#fff; border:none; border-radius:16px; padding:18px 32px; font-size:16px; font-weight:800; cursor:pointer; width:100%; transition:opacity 0.2s; }
          .btn:hover { opacity:0.9; }
          .deukway { margin-top:24px; font-size:12px; color:#D1D5DB; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <div class="subtitle">Paiement confirmé</div>
          <h1>Merci pour votre paiement !</h1>
          <p>Votre transaction a été traitée avec succès par PayDunya. Vous pouvez fermer cette fenêtre et retourner sur Deukway.</p>
          <div class="token">
            <span>Référence de transaction</span>
            ${token || 'N/A'}
          </div>
          <button class="btn" onclick="window.close()">✓ Fermer et retourner</button>
          <div class="deukway">Deukway • Plateforme immobilière au Sénégal</div>
        </div>
      </body>
      </html>
    `);
  }

  @Post('ipn')
  async ipn(@Body() body: any) {
    console.log('IPN received:', JSON.stringify(body));
    return { message: 'ok' };
  }
}