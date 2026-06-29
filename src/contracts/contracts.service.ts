import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createContract(ownerId: string, visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { tenant: true, owner: true, listing: true },
    });

    if (!visit) throw new NotFoundException('Visite introuvable');
    if (visit.ownerId !== ownerId) throw new ForbiddenException('Acces refuse');
    if (visit.status !== 'CONFIRMED') throw new ForbiddenException('La visite doit etre confirmee');

    const existing = await this.prisma.contract.findUnique({ where: { visitId } });
    if (existing) return existing;

    const content = this.generateContractText(visit);

    const contract = await this.prisma.contract.create({
      data: {
        visitId,
        ownerId,
        tenantId: visit.tenantId,
        listingId: visit.listingId,
        content,
        status: 'PENDING',
      },
      include: {
        visit: { include: { listing: true } },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        listing: true,
      },
    });

    // Notifier le locataire
    await this.notifications.sendPushNotification(
      visit.tenantId,
      '📄 Nouveau contrat',
      `${visit.owner.firstName} vous a envoyé un contrat pour ${visit.listing.title}`,
      { type: 'contract', contractId: contract.id },
    );

    return contract;
  }

  generateContractText(visit: any) {
    var listing = visit.listing;
    var tenant = visit.tenant;
    var owner = visit.owner;
    var date = new Date().toLocaleDateString('fr-SN');

    return `CONTRAT DE LOCATION

Dakar, le ${date}

ENTRE LES SOUSSIGNES :

BAILLEUR : ${owner.firstName} ${owner.lastName}
Telephone : ${owner.phone}

LOCATAIRE : ${tenant.firstName} ${tenant.lastName}
Telephone : ${tenant.phone}

IL A ETE CONVENU CE QUI SUIT :

Article 1 - OBJET DU CONTRAT
Le bailleur loue au locataire le bien immobilier suivant :
- Type : ${listing.type}
- Adresse : ${listing.address || listing.neighborhood + ', ' + listing.city}
- Description : ${listing.title}

Article 2 - DUREE
Le present contrat est conclu pour une duree d'un (1) an a compter de la date de signature, renouvelable par tacite reconduction.

Article 3 - LOYER
Le loyer mensuel est fixe a ${new Intl.NumberFormat('fr-SN').format(listing.price)} FCFA, payable le 1er de chaque mois.

Article 4 - CAUTION
Une caution equivalente a ${listing.deposit ? new Intl.NumberFormat('fr-SN').format(listing.deposit) + ' FCFA' : 'un (1) mois de loyer'} est versee a la signature du present contrat.

Article 5 - OBLIGATIONS DU LOCATAIRE
- Payer le loyer aux echeances convenues
- Entretenir le logement en bon etat
- Ne pas sous-louer sans accord du bailleur
- Respecter le voisinage

Article 6 - OBLIGATIONS DU BAILLEUR
- Delivrer le logement en bon etat
- Assurer la jouissance paisible du logement
- Effectuer les reparations necessaires

Article 7 - RESILIATION
Le contrat peut etre resilie par l'une ou l'autre des parties avec un preavis d'un (1) mois.

Fait a Dakar, le ${date}

Signature du Bailleur :                    Signature du Locataire :

___________________                        ___________________
${owner.firstName} ${owner.lastName}`;
  }

  async getMyContracts(userId: string, role: string) {
    if (role === 'OWNER') {
      return this.prisma.contract.findMany({
        where: { ownerId: userId },
        include: {
          tenant: { select: { id: true, firstName: true, lastName: true, phone: true, avatar: true } },
          listing: { include: { media: { take: 1 } } },
          visit: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.contract.findMany({
      where: { tenantId: userId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, avatar: true } },
        listing: { include: { media: { take: 1 } } },
        visit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContract(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        listing: { include: { media: { take: 1 } } },
        visit: true,
      },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    if (contract.ownerId !== userId && contract.tenantId !== userId) throw new ForbiddenException('Acces refuse');
    return contract;
  }

  async signContract(id: string, tenantId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        owner: true,
        tenant: true,
        listing: true,
      },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    if (contract.tenantId !== tenantId) throw new ForbiddenException('Acces refuse');
    if (contract.status === 'SIGNED') throw new ForbiddenException('Contrat deja signe');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: 'SIGNED', signedAt: new Date() },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        listing: true,
      },
    });

    // Notifier le propriétaire
    await this.notifications.sendPushNotification(
      contract.ownerId,
      '✅ Contrat signé !',
      `${contract.tenant.firstName} a signé le contrat pour ${contract.listing.title}`,
      { type: 'contract_signed', contractId: id },
    );

    return updated;
  }

  async rejectContract(id: string, tenantId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { tenant: true, listing: true },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    if (contract.tenantId !== tenantId) throw new ForbiddenException('Acces refuse');

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Notifier le propriétaire
    await this.notifications.sendPushNotification(
      contract.ownerId,
      '❌ Contrat refusé',
      `${contract.tenant.firstName} a refusé le contrat pour ${contract.listing.title}`,
      { type: 'contract_rejected', contractId: id },
    );

    return updated;
  }
}