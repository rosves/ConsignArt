import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Exhibition } from 'src/Entities/exhibition-entity';
import { Loan } from 'src/Entities/loan-entity';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import type { UserType } from 'src/auth/type/jwtPayload';
import { ArtworkStatus, UserRole, ExhibitionType } from 'src/common/enum';

@Injectable()
export class ExhibitionsService {
  constructor(
    @InjectRepository(Exhibition)
    private readonly exhibitionRepository: Repository<Exhibition>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(ArtworkStatusHistory)
    private readonly historyRepository: Repository<ArtworkStatusHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createExhibitionDto: CreateExhibitionDto, currentUser: UserType): Promise<Exhibition> {
    const galleryId = currentUser.role === UserRole.GALLERY ? currentUser.id : (createExhibitionDto.galleryId || currentUser.id);

    const artworks = await this.artworkRepository.find({
      where: { id: In(createExhibitionDto.artworkIds) },
    });

    if (artworks.length !== createExhibitionDto.artworkIds.length) {
      throw new NotFoundException('One or more artworks were not found');
    }

    const unavailable = artworks.filter((a) => a.status !== ArtworkStatus.AVAILABLE);
    if (unavailable.length > 0) {
      throw new BadRequestException(`Some artworks are not available: ${unavailable.map((a) => a.id).join(', ')}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const exhibition = queryRunner.manager.create(Exhibition, {
        name: createExhibitionDto.name,
        startDate: new Date(createExhibitionDto.startDate),
        endDate: new Date(createExhibitionDto.endDate),
        location: createExhibitionDto.location,
        type: createExhibitionDto.type,
        description: createExhibitionDto.description,
        galleryId,
        artworks,
      });
      const savedExhibition = await queryRunner.manager.save(exhibition);

      for (const artwork of artworks) {
        artwork.status = ArtworkStatus.ON_LOAN;
        await queryRunner.manager.save(artwork);

        const history = queryRunner.manager.create(ArtworkStatusHistory, {
          artworkId: artwork.id,
          fromStatus: ArtworkStatus.AVAILABLE,
          toStatus: ArtworkStatus.ON_LOAN,
          reason: `Added to exhibition: ${savedExhibition.name}`,
          changedById: currentUser.id,
        });
        await queryRunner.manager.save(history);
      }

      await queryRunner.commitTransaction();
      return savedExhibition;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(galleryId?: string, type?: ExhibitionType): Promise<Exhibition[]> {
    const query = this.exhibitionRepository.createQueryBuilder('exhibition')
      .leftJoinAndSelect('exhibition.gallery', 'gallery')
      .leftJoinAndSelect('exhibition.artworks', 'artworks');

    if (galleryId) {
      query.andWhere('exhibition.galleryId = :galleryId', { galleryId });
    }

    if (type) {
      query.andWhere('exhibition.type = :type', { type });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Exhibition> {
    const exhibition = await this.exhibitionRepository.findOne({
      where: { id },
      relations: { artworks: true, gallery: true, loans: true },
    });

    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    return exhibition;
  }

  async update(id: string, updateDto: UpdateExhibitionDto, currentUser: UserType): Promise<Exhibition> {
    const exhibition = await this.findOne(id);

    if (currentUser.role === UserRole.GALLERY && exhibition.galleryId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own exhibitions');
    }

    Object.assign(exhibition, updateDto);
    return this.exhibitionRepository.save(exhibition);
  }

  async closeExhibition(id: string, currentUser: UserType): Promise<{ message: string }> {
    const exhibition = await this.findOne(id);

    if (currentUser.role === UserRole.GALLERY && exhibition.galleryId !== currentUser.id) {
      throw new ForbiddenException('You can only close your own exhibitions');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const artwork of exhibition.artworks) {
        if (artwork.status === ArtworkStatus.ON_LOAN) {
          artwork.status = ArtworkStatus.AVAILABLE;
          await queryRunner.manager.save(artwork);

          const history = queryRunner.manager.create(ArtworkStatusHistory, {
            artworkId: artwork.id,
            fromStatus: ArtworkStatus.ON_LOAN,
            toStatus: ArtworkStatus.AVAILABLE,
            reason: `Exhibition closed: ${exhibition.name}`,
            changedById: currentUser.id,
          });
          await queryRunner.manager.save(history);
        }
      }

      await queryRunner.commitTransaction();
      return { message: `Exhibition ${id} closed and artworks returned to AVAILABLE` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createLoan(dto: CreateLoanDto, currentUser: UserType): Promise<Loan> {
    const artwork = await this.artworkRepository.findOne({
      where: { id: dto.artworkId },
      relations: { artist: true },
    });

    if (!artwork) {
      throw new NotFoundException(`Artwork ${dto.artworkId} not found`);
    }

    if (artwork.status !== ArtworkStatus.AVAILABLE) {
      throw new BadRequestException(`Artwork ${dto.artworkId} is not available for loan`);
    }

    const lenderGalleryId = currentUser.role === UserRole.GALLERY ? currentUser.id : (artwork.artist?.galleryId || currentUser.id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const loan = queryRunner.manager.create(Loan, {
        artworkId: dto.artworkId,
        lenderGalleryId,
        borrowerGalleryId: dto.borrowerGalleryId,
        exhibitionId: dto.exhibitionId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        conditions: dto.conditions,
      });
      const savedLoan = await queryRunner.manager.save(loan);

      artwork.status = ArtworkStatus.ON_LOAN;
      await queryRunner.manager.save(artwork);

      const history = queryRunner.manager.create(ArtworkStatusHistory, {
        artworkId: artwork.id,
        fromStatus: ArtworkStatus.AVAILABLE,
        toStatus: ArtworkStatus.ON_LOAN,
        reason: `Loaned to gallery: ${dto.borrowerGalleryId}`,
        changedById: currentUser.id,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      return savedLoan;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async returnLoan(loanId: string, currentUser: UserType): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: { artwork: true },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${loanId} not found`);
    }

    if (loan.returnedAt) {
      throw new BadRequestException(`Loan ${loanId} is already marked as returned`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      loan.returnedAt = new Date();
      const updatedLoan = await queryRunner.manager.save(loan);

      const artwork = loan.artwork;
      if (artwork) {
        artwork.status = ArtworkStatus.AVAILABLE;
        await queryRunner.manager.save(artwork);

        const history = queryRunner.manager.create(ArtworkStatusHistory, {
          artworkId: artwork.id,
          fromStatus: ArtworkStatus.ON_LOAN,
          toStatus: ArtworkStatus.AVAILABLE,
          reason: `Returned from loan: ${loanId}`,
          changedById: currentUser.id,
        });
        await queryRunner.manager.save(history);
      }

      await queryRunner.commitTransaction();
      return updatedLoan;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
