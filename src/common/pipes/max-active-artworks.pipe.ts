import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatus } from '../enum';
import { CreateArtworkDto } from 'src/artworks/dto/create-artwork.dto';

@Injectable()
export class MaxActiveArtworksPipe implements PipeTransform {
  constructor(private readonly dataSource: DataSource) {}

  async transform(value: CreateArtworkDto) {
    if (!value || !value.artistId) {
      return value;
    }

    const count = await this.dataSource.getRepository(Artwork).count({
      where: {
        artistId: value.artistId,
        status: In([ArtworkStatus.AVAILABLE, ArtworkStatus.ON_LOAN]),
      },
    });

    if (count >= 50) {
      throw new BadRequestException(
        'An artist cannot have more than 50 active artworks simultaneously (AVAILABLE or ON_LOAN)',
      );
    }

    return value;
  }
}
