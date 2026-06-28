import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { MediaModule } from './media/media.module';
import { FavoritesModule } from './favorites/favorites.module';
import { VisitsModule } from './visits/visits.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    MediaModule,
    FavoritesModule,
    VisitsModule,
    ChatModule,
    PaymentsModule,
    ContractsModule,
  ],
})
export class AppModule {}