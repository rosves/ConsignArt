import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from '../Entities/sale-entity';
import { Artwork } from '../Entities/artwork-entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Artwork])],
  providers: [SalesService],
  controllers: [SalesController]
})
export class SalesModule {}