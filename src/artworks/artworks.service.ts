import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { ChangeArtworkStatusDto } from './dto/change-status.dto';
import type { UserType } from 'src/auth/type/jwtPayload';
import { ArtworkStatus, UserRole } from 'src/common/enum';

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(ArtworkStatusHistory)
    private readonly historyRepository: Repository<ArtworkStatusHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createArtworkDto: CreateArtworkDto, currentUser: UserType): Promise<Artwork> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const artwork = queryRunner.manager.create(Artwork, {
        ...createArtworkDto,
        status: ArtworkStatus.AVAILABLE,
        consignedAt: new Date(),
      });
      const savedArtwork = await queryRunner.manager.save(artwork);

      const history = queryRunner.manager.create(ArtworkStatusHistory, {
        artworkId: savedArtwork.id,
        fromStatus: null,
        toStatus: ArtworkStatus.AVAILABLE,
        reason: 'Initial consignment',
        changedById: currentUser.id,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      return savedArtwork;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(status?: ArtworkStatus, artistId?: string): Promise<Artwork[]> {
    const query = this.artworkRepository.createQueryBuilder('artwork')
      .leftJoinAndSelect('artwork.artist', 'artist')
      .leftJoinAndSelect('artwork.statusHistories', 'statusHistories');

    if (status) {
      query.andWhere('artwork.status = :status', { status });
    }

    if (artistId) {
      query.andWhere('artwork.artistId = :artistId', { artistId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Artwork> {
    const artwork = await this.artworkRepository.findOne({
      where: { id },
      relations: { artist: true, statusHistories: true },
    });

    if (!artwork) {
      throw new NotFoundException(`Artwork with ID ${id} not found`);
    }

    return artwork;
  }

  async changeStatus(id: string, dto: ChangeArtworkStatusDto, currentUser: UserType): Promise<Artwork> {
    const artwork = await this.findOne(id);
    const fromStatus = artwork.status;
    const toStatus = dto.toStatus;

    this.validateStatusTransition(fromStatus, toStatus, currentUser.role);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      artwork.status = toStatus;
      const updatedArtwork = await queryRunner.manager.save(artwork);

      const history = queryRunner.manager.create(ArtworkStatusHistory, {
        artworkId: artwork.id,
        fromStatus,
        toStatus,
        reason: dto.reason || `Status changed from ${fromStatus} to ${toStatus}`,
        changedById: currentUser.id,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      return updatedArtwork;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private validateStatusTransition(from: ArtworkStatus, to: ArtworkStatus, userRole: UserRole): void {
    if (from === ArtworkStatus.SOLD && to !== ArtworkStatus.RETURNED) {
      throw new BadRequestException('A sold artwork cannot change status unless returned by admin');
    }

    if (to === ArtworkStatus.RETURNED && userRole !== UserRole.ADMIN) {
      throw new BadRequestException('Only administrators can mark an artwork as RETURNED');
    }

    const allowedTransitions: Record<ArtworkStatus, ArtworkStatus[]> = {
      [ArtworkStatus.AVAILABLE]: [ArtworkStatus.ON_LOAN, ArtworkStatus.SOLD],
      [ArtworkStatus.ON_LOAN]: [ArtworkStatus.AVAILABLE],
      [ArtworkStatus.SOLD]: [ArtworkStatus.RETURNED],
      [ArtworkStatus.RETURNED]: [ArtworkStatus.AVAILABLE],
    };

    if (!allowedTransitions[from]?.includes(to)) {
      throw new BadRequestException(`Invalid status transition from ${from} to ${to}`);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const artwork = await this.findOne(id);
    await this.artworkRepository.remove(artwork);
    return { message: `Artwork ${id} successfully removed` };
  }
}
