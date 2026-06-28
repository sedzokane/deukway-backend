import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(userId: string, amount: number, description: string, returnUrl: string) {
    const headers = {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY',
      'PAYDUNYA-PRIVATE-KEY': 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk',
      'PAYDUNYA-TOKEN': 'KpVf7J0eswO6CbMe5OHk',
    };

    const body = {
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

    console.log('Calling PayDunya API directly...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      console.log('PayDunya response:', JSON.stringify(data));
      return data;
    } catch(e) {
      clearTimeout(timeout);
      console.error('PayDunya fetch error:', e.message);
      throw new Error('PayDunya unavailable: ' + e.message);
    }
  }

  async checkInvoice(token: string) {
    const headers = {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY',
      'PAYDUNYA-PRIVATE-KEY': 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk',
      'PAYDUNYA-TOKEN': 'KpVf7J0eswO6CbMe5OHk',
    };
    const response = await fetch(`https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: headers,
    });
    return response.json();
  }
}