import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../Entities/sale-entity';
import { User } from '../Entities/user-entity';
import { Artwork } from '../Entities/artwork-entity';
import { Artist } from '../Entities/artist-entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, User, Artwork, Artist])],
  providers: [ReportsService],
  controllers: [ReportsController]
})
export class ReportsModule {}