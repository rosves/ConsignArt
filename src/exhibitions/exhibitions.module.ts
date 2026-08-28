import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExhibitionsService } from './exhibitions.service';
import { ExhibitionsController } from './exhibitions.controller';
import { Exhibition } from 'src/Entities/exhibition-entity';
import { Loan } from 'src/Entities/loan-entity';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exhibition, Loan, Artwork, ArtworkStatusHistory])],
  controllers: [ExhibitionsController],
  providers: [ExhibitionsService],
  exports: [ExhibitionsService],
})
export class ExhibitionsModule {}