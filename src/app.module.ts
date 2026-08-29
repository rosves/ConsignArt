import { Module } from '@nestjs/common';
import { ConfigModule } from './common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Artist,
  Artwork,
  ArtworkStatusHistory,
  Sale,
  Exhibition,
  Loan,
} from './Entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtGuard } from './common/guards/jwt.guard';
import { RoleGuard } from './common/guards/role.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ArtistsModule } from './artists/artists.module';
import { ArtworksModule } from './artworks/artworks.module';
import { ExhibitionsModule } from './exhibitions/exhibitions.module';
import { SalesModule } from './sales/sales.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [User, Artist, Artwork, ArtworkStatusHistory, Sale, Exhibition, Loan],
        synchronize: config.get<string>('app.nodeEnv') === 'development',
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    ArtistsModule,
    ArtworksModule,
    ExhibitionsModule,
    SalesModule,
    AdminModule,
  ],
  providers : [
    // on définit ici les guards à cause des injections de dépendances
    {
      provide : APP_GUARD, // correspond à un token spéciale pour définir le guard globalement
      useClass : JwtGuard,
    },
    {
      provide : APP_GUARD,
      useClass : RoleGuard
    },
    {
      provide : APP_INTERCEPTOR,
      useClass : LoggingInterceptor
    },
    {
      provide : APP_INTERCEPTOR,
      useClass : ResponseInterceptor
    }
  ]
})

export class AppModule {}