import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Res } from '@nestjs/common';
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

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Request() req, @Res() res: any) {
    const contract = await this.contractsService.getContract(id, req.user.userId);
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contrat-'+id.slice(0,8)+'.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('DEUKWAY - Plateforme immobiliere au Senegal', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text('N° Ref: ' + id.slice(0,8).toUpperCase(), { align: 'center' });
    doc.moveDown(2);

    // Parties
    doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('ENTRE LES SOUSSIGNES :');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('BAILLEUR : ' + (contract.owner ? contract.owner.firstName + ' ' + contract.owner.lastName : '—'));
    doc.text('Telephone : ' + (contract.owner ? contract.owner.phone : '—'));
    doc.moveDown(0.5);
    doc.text('LOCATAIRE : ' + (contract.tenant ? contract.tenant.firstName + ' ' + contract.tenant.lastName : '—'));
    doc.text('Telephone : ' + (contract.tenant ? contract.tenant.phone : '—'));
    doc.moveDown(1.5);

    // Contenu
    doc.font('Helvetica').fontSize(11).text(contract.content);
    doc.moveDown(2);

    // Signatures
    doc.font('Helvetica-Bold').fontSize(12).text('SIGNATURES', { align: 'center' });
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(11);
    const signY = doc.y;
    doc.text('Le Bailleur :', 50, signY);
    doc.text('Le Locataire :', 320, signY);
    doc.moveDown(3);
    doc.text(contract.owner ? contract.owner.firstName + ' ' + contract.owner.lastName : '—', 50);
    doc.text(contract.status === 'SIGNED' ? (contract.tenant ? contract.tenant.firstName + ' ' + contract.tenant.lastName : '—') + ' (Signe)' : 'En attente de signature', 320, doc.y - doc.currentLineHeight());
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).fillColor('#999').text('Document genere par Deukway - ' + new Date().toLocaleDateString('fr-SN'), { align: 'center' });

    doc.end();
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