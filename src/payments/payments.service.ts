import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const paydunya = require('paydunya');

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {
    paydunya.Setup.masterKey = 'TdBzwUdV-vemt-YVWH-ZgqH-v3cF7WOr60kY';
    paydunya.Setup.privateKey = 'test_private_ZoNhhFEytY0dJhsUZAp9PUxZaOk';
    paydunya.Setup.publicKey = 'test_public_1FRdKfkjhI5F8dqQQlNhKPmqUn6';
    paydunya.Setup.token = 'KpVf7J0eswO6CbMe5OHk';
    paydunya.Setup.mode = 'test';

    paydunya.Store.name = 'Deukway';
    paydunya.Store.tagline = 'Location immobiliere au Senegal';
    paydunya.Store.phoneNumber = '338000000';
    paydunya.Store.postalAddress = 'Dakar, Senegal';
    paydunya.Store.websiteUrl = 'https://deukway-backend-production.up.railway.app';
  }

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
            reject(new Error(err));
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