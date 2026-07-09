import { Injectable } from '@nestjs/common';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = 'seydoukane015@gmail.com';
const FROM_NAME = 'Deukway';

@Injectable()
export class MailService {
  private async send(to: string, toName: string, subject: string, html: string) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: FROM_EMAIL, name: FROM_NAME },
          to: [{ email: to, name: toName }],
          subject,
          htmlContent: html,
        }),
      });
      const data = await response.json();
      console.log('Mail sent:', subject, 'to', to, data);
      return data;
    } catch (e) {
      console.error('Mail error:', e.message);
    }
  }

  async sendBienvenue(user: any) {
    if (!user.email) return;
    await this.send(
      user.email,
      user.firstName + ' ' + user.lastName,
      '🎉 Bienvenue sur Deukway !',
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1A0800,#C8791A);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:28px">Deukway</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Plateforme immobilière au Sénégal</p>
        </div>
        <h2 style="color:#C8791A">Bienvenue ${user.firstName} ! 🎉</h2>
        <p>Votre compte Deukway a été créé avec succès.</p>
        <div style="background:#FEF4E7;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #C8791A">
          <p style="margin:0 0 8px"><strong>👤 Nom :</strong> ${user.firstName} ${user.lastName}</p>
          <p style="margin:0 0 8px"><strong>📞 Téléphone :</strong> ${user.phone}</p>
          <p style="margin:0"><strong>🎭 Profil :</strong> ${user.role === 'OWNER' ? 'Propriétaire' : 'Locataire'}</p>
        </div>
        <p>${user.role === 'OWNER' ? 'Vous pouvez maintenant publier vos annonces et gérer vos biens.' : 'Vous pouvez maintenant rechercher votre logement idéal au Sénégal.'}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="https://deukway.sn" style="background:#C8791A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Commencer</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Deukway — Votre logement idéal au Sénégal</p>
      </div>
      `
    );
  }

  async sendVisiteDemandeOwner(owner: any, tenant: any, listing: any, date: string) {
    var d = new Date(date).toLocaleDateString('fr-SN', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    await this.send(
      owner.email,
      owner.firstName + ' ' + owner.lastName,
      '📅 Nouvelle demande de visite — ' + listing.title,
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1B4F3A,#2D7A5F);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Deukway</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Plateforme immobilière au Sénégal</p>
        </div>
        <h2 style="color:#1B4F3A">Nouvelle demande de visite</h2>
        <p>Bonjour <strong>${owner.firstName}</strong>,</p>
        <p><strong>${tenant.firstName} ${tenant.lastName}</strong> souhaite visiter votre bien :</p>
        <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #1B4F3A">
          <p style="margin:0 0 8px"><strong>🏠 Bien :</strong> ${listing.title}</p>
          <p style="margin:0 0 8px"><strong>📍 Adresse :</strong> ${listing.neighborhood}, ${listing.city}</p>
          <p style="margin:0"><strong>📅 Date souhaitée :</strong> ${d}</p>
        </div>
        <p>Connectez-vous sur Deukway pour confirmer ou refuser cette visite.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="https://deukway.sn" style="background:#1B4F3A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Voir la demande</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Deukway — Votre logement idéal au Sénégal</p>
      </div>
      `
    );
  }

  async sendVisiteConfirmeeTenant(tenant: any, owner: any, listing: any, date: string) {
    var d = new Date(date).toLocaleDateString('fr-SN', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    await this.send(
      tenant.email,
      tenant.firstName + ' ' + tenant.lastName,
      '✅ Visite confirmée — ' + listing.title,
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1A0800,#C8791A);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Deukway</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Plateforme immobilière au Sénégal</p>
        </div>
        <h2 style="color:#C8791A">Votre visite est confirmée ! 🎉</h2>
        <p>Bonjour <strong>${tenant.firstName}</strong>,</p>
        <p>Bonne nouvelle ! <strong>${owner.firstName} ${owner.lastName}</strong> a confirmé votre visite :</p>
        <div style="background:#FEF4E7;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #C8791A">
          <p style="margin:0 0 8px"><strong>🏠 Bien :</strong> ${listing.title}</p>
          <p style="margin:0 0 8px"><strong>📍 Adresse :</strong> ${listing.neighborhood}, ${listing.city}</p>
          <p style="margin:0 0 8px"><strong>📅 Date :</strong> ${d}</p>
          <p style="margin:0"><strong>📞 Contact :</strong> ${owner.phone}</p>
        </div>
        <p>Préparez-vous pour la visite et n'hésitez pas à contacter le propriétaire via la messagerie Deukway.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="https://deukway.sn" style="background:#C8791A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Ouvrir Deukway</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Deukway — Votre logement idéal au Sénégal</p>
      </div>
      `
    );
  }

  async sendContratCreeTenant(tenant: any, owner: any, listing: any) {
    await this.send(
      tenant.email,
      tenant.firstName + ' ' + tenant.lastName,
      '📄 Nouveau contrat à signer — ' + listing.title,
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1A0800,#C8791A);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Deukway</h1>
        </div>
        <h2 style="color:#1B4F3A">Un contrat vous attend</h2>
        <p>Bonjour <strong>${tenant.firstName}</strong>,</p>
        <p><strong>${owner.firstName} ${owner.lastName}</strong> vous a envoyé un contrat de location :</p>
        <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #1B4F3A">
          <p style="margin:0 0 8px"><strong>🏠 Bien :</strong> ${listing.title}</p>
          <p style="margin:0"><strong>📍 Adresse :</strong> ${listing.neighborhood}, ${listing.city}</p>
        </div>
        <p>Lisez attentivement le contrat avant de le signer. Vous pouvez le consulter dans la section <strong>Mes contrats</strong> de l'application.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="https://deukway.sn" style="background:#1B4F3A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Voir le contrat</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Deukway — Votre logement idéal au Sénégal</p>
      </div>
      `
    );
  }

  async sendContratSigneOwner(owner: any, tenant: any, listing: any) {
    await this.send(
      owner.email,
      owner.firstName + ' ' + owner.lastName,
      '✅ Contrat signé — ' + listing.title,
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1B4F3A,#2D7A5F);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:24px">Deukway</h1>
        </div>
        <h2 style="color:#1B4F3A">Contrat signé ! 🎉</h2>
        <p>Bonjour <strong>${owner.firstName}</strong>,</p>
        <p><strong>${tenant.firstName} ${tenant.lastName}</strong> a signé le contrat de location :</p>
        <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #1B4F3A">
          <p style="margin:0 0 8px"><strong>🏠 Bien :</strong> ${listing.title}</p>
          <p style="margin:0 0 8px"><strong>📍 Adresse :</strong> ${listing.neighborhood}, ${listing.city}</p>
          <p style="margin:0"><strong>📞 Locataire :</strong> ${tenant.phone}</p>
        </div>
        <p>Le contrat est maintenant actif. Vous pouvez consulter tous les détails dans la section <strong>Contrats</strong> de l'application.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="#" style="background:#1B4F3A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Voir le contrat</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Deukway — Votre logement idéal au Sénégal</p>
      </div>
      `
    );
  }
}