import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Artwork } from 'src/Entities/artwork-entity';
import { UserRole } from '../enum';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const artworkId = request.params.id || request.params.artworkId;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (!artworkId) {
      return true;
    }

    const artwork = await this.dataSource.getRepository(Artwork).findOne({
      where: { id: artworkId },
      relations: { artist: true },
    });

    if (!artwork) {
      throw new NotFoundException(`Artwork with ID ${artworkId} not found`);
    }

    if (artwork.artist && artwork.artist.galleryId !== user.id) {
      throw new ForbiddenException('You do not own this artwork');
    }

    return true;
  }
}
