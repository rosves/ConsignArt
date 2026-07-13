import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Artist, Loan, Sale, Exhibition, Artwork, ArtworkStatusHistory } from "./Entities"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal : true
    }),
    TypeOrmModule.forRootAsync({
      imports : [ConfigModule],
      inject : [ConfigService],
      useFactory : (config : ConfigService) => ({
        type : "postgres",
        host : config.getOrThrow<string>('DB_HOST'),
        port : config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        entities: [],
        synchronize: true,
        logging: true,
      })
    })
  ],
})

export class AppModule {}
