import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworksService } from './artworks.service';
import { ArtworksController } from './artworks.controller';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';
import { OwnershipGuard } from 'src/common/guards/ownership.guard';
import { MaxActiveArtworksPipe } from 'src/common/pipes/max-active-artworks.pipe';

@Module({
  imports: [TypeOrmModule.forFeature([Artwork, ArtworkStatusHistory])],
  controllers: [ArtworksController],
  providers: [ArtworksService, OwnershipGuard, MaxActiveArtworksPipe],
  exports: [ArtworksService],
})
export class ArtworksModule {}
