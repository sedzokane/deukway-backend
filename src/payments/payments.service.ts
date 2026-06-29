import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CHANNEL_MAP: any = {
  wave: 'WAVE_SN',
  orange: 'ORANGE_MONEY_SENEGAL',
  free: 'FREE_MONEY_SENEGAL',
  emoney: 'EXPRESSO_SN',
  card: 'CARD',
};

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(userId: string, amount: number, description: string, returnUrl: string, channel?: string) {
    const body: any = {
      invoice: {
        total_amount: amount,
        description: description,
      },
      store: {
        name: 'Deukway',
        tagline: 'Location immobiliere au Senegal',
        phone_number: '338000000',
        postal_address: 'Dakar, Senegal',
        website_url: 'https://deukway-backend-production.up.railway.app',
      },
      actions: {
        return_url: returnUrl,
        cancel_url: returnUrl,
      },
    };

    if (channel && CHANNEL_MAP[channel]) {
      body.invoice.channels = [CHANNEL_MAP[channel]];
    }

    console.log('Calling PayDunya API, channel:', channel, 'amount:', amount);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY',
          'PAYDUNYA-PRIVATE-KEY': 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk',
          'PAYDUNYA-TOKEN': 'KpVf7J0eswO6CbMe5OHk',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      console.log('PayDunya response:', JSON.stringify(data));

      // Sauvegarder le paiement en DB
      if (data.token) {
        await this.prisma.payment.create({
          data: {
            userId,
            amount,
            description,
            channel: channel || null,
            token: data.token,
            status: 'PENDING',
          },
        });
      }

      return data;
    } catch(e) {
      clearTimeout(timeout);
      console.error('PayDunya fetch error:', e.message);
      throw new Error('PayDunya unavailable: ' + e.message);
    }
  }

  async checkInvoice(token: string) {
    const response = await fetch(`https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY',
        'PAYDUNYA-PRIVATE-KEY': 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk',
        'PAYDUNYA-TOKEN': 'KpVf7J0eswO6CbMe5OHk',
      },
    });
    const data = await response.json();

    // Mettre à jour le statut en DB
    if (data.status === 'completed') {
      await this.prisma.payment.updateMany({
        where: { token },
        data: { status: 'COMPLETED' },
      });
    } else if (data.status === 'failed') {
      await this.prisma.payment.updateMany({
        where: { token },
        data: { status: 'FAILED' },
      });
    }

    return data;
  }

  async getHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        listing: { select: { id: true, title: true, neighborhood: true, city: true } },
        contract: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}