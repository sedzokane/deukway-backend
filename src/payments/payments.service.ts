import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const paydunya = require('paydunya');

const setup = new paydunya.Setup({
  masterKey: 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY',
  privateKey: 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk',
  publicKey: 'test_public_1FRdKfkjhI5F8dqQQlNhKPmqUn6',
  token: 'KpVf7J0eswO6CbMe5OHk',
  mode: 'test',
});

const store = new paydunya.Store({
  name: 'Deukway',
  tagline: 'Location immobiliere au Senegal',
  phoneNumber: '338000000',
  postalAddress: 'Dakar, Senegal',
  websiteUrl: 'https://deukway-backend-production.up.railway.app',
});

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(userId: string, amount: number, description: string, returnUrl: string) {
    try {
      console.log('Creating invoice for user:', userId, 'amount:', amount);
      const invoice = new paydunya.CheckoutInvoice();
      invoice.addItem('Deukway Service', 1, amount, amount, description);
      invoice.totalAmount = amount;
      invoice.description = description;
      invoice.returnUrl = returnUrl;
      invoice.cancelUrl = returnUrl;

      const result = await new Promise((resolve, reject) => {
        invoice.create((err: any, response: any) => {
          if (err) {
            console.error('PayDunya error:', err);
            reject(new Error(String(err)));
          } else {
            console.log('PayDunya response:', JSON.stringify(response));
            resolve(response);
          }
        });
      });

      return result;
    } catch(e) {
      console.error('Invoice creation failed:', e.message);
      throw e;
    }
  }

  async checkInvoice(token: string) {
    const invoice = new paydunya.CheckoutInvoice();
    const result = await new Promise((resolve, reject) => {
      invoice.confirm(token, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
    return result;
  }
}