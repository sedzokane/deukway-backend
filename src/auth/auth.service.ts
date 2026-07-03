import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const phoneExists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (phoneExists) throw new ConflictException('Ce numero est deja utilise');

    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('Cet email est deja utilise');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        password: hashed,
        role: dto.role || 'TENANT',
        city: dto.city,
      },
    });

    // Email de bienvenue
    if (user.email) {
      this.mail.sendBienvenue(user).catch(function(){});
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const { password, ...result } = user;
    return { user: result, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('Identifiants incorrects');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants incorrects');

    if (!user.isActive) throw new UnauthorizedException('Compte desactive');

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const { password, ...result } = user;
    return { user: result, token };
  }

  async googleAuth(googleToken: string) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + googleToken },
      });
      const googleUser = await response.json();

      if (!googleUser.email) throw new UnauthorizedException('Token Google invalide');

      var existing = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

      if (existing) {
        if (!existing.avatar && googleUser.picture) {
          existing = await this.prisma.user.update({
            where: { id: existing.id },
            data: { avatar: googleUser.picture },
          });
        }
        const token = this.jwtService.sign({ sub: existing.id, role: existing.role });
        const { password, ...result } = existing;
        return { user: result, token };
      }

      var names = (googleUser.name || 'Utilisateur Google').split(' ');
      var firstName = names[0] || 'Utilisateur';
      var lastName = names.slice(1).join(' ') || 'Google';
      var tempPhone = '+000' + Date.now().toString().slice(-9);
      var hashed = await bcrypt.hash('google_' + googleUser.sub, 10);

      var newUser = await this.prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: googleUser.email,
          phone: tempPhone,
          password: hashed,
          avatar: googleUser.picture || null,
          role: 'TENANT',
          isVerified: true,
        },
      });

      // Email de bienvenue Google
      this.mail.sendBienvenue(newUser).catch(function(){});

      const token = this.jwtService.sign({ sub: newUser.id, role: newUser.role });
      const { password, ...result } = newUser;
      return { user: result, token, isNew: true };

    } catch(e) {
      console.error('Google auth error:', e.message);
      throw new UnauthorizedException('Connexion Google echouee');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        city: true,
        isVerified: true,
        isPremium: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }
}