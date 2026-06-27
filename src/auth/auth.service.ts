import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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