import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from 'src/Entities/artist-entity';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { TransferArtistDto } from './dto/transfer-artist.dto';
import { UserType } from 'src/auth/type/jwtPayload';
import { UserRole, ArtistStatus } from 'src/common/enum';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async create(createArtistDto: CreateArtistDto, currentUser: UserType): Promise<Artist> {
    const artist = this.artistRepository.create(createArtistDto);

    if (currentUser.role === UserRole.GALLERY) {
      artist.galleryId = currentUser.id;
      artist.enterAt = new Date();
    } else if (currentUser.role === UserRole.ADMIN && createArtistDto.galleryId) {
      artist.galleryId = createArtistDto.galleryId;
      artist.enterAt = createArtistDto.enterAt ? new Date(createArtistDto.enterAt) : new Date();
    }

    artist.status = ArtistStatus.ACTIVE;
    return this.artistRepository.save(artist);
  }

  async findAll(galleryId?: string, status?: ArtistStatus): Promise<Artist[]> {
    const query = this.artistRepository.createQueryBuilder('artist')
      .leftJoinAndSelect('artist.gallery', 'gallery')
      .leftJoinAndSelect('artist.artworks', 'artworks');

    if (galleryId) {
      query.andWhere('artist.galleryId = :galleryId', { galleryId });
    }

    if (status) {
      query.andWhere('artist.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Artist> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: { gallery: true, artworks: true },
    });

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  async update(id: string, updateArtistDto: UpdateArtistDto, currentUser: UserType): Promise<Artist> {
    const artist = await this.findOne(id);

    if (currentUser.role === UserRole.GALLERY && artist.galleryId !== currentUser.id) {
      throw new ForbiddenException('You can only update artists belonging to your gallery');
    }

    Object.assign(artist, updateArtistDto);
    return this.artistRepository.save(artist);
  }

  async changeStatus(id: string, status: ArtistStatus, currentUser: UserType): Promise<Artist> {
    return this.update(id, { status }, currentUser);
  }

  async transferGallery(id: string, transferDto: TransferArtistDto, currentUser: UserType): Promise<Artist> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can approve artist transfers between galleries');
    }

    const artist = await this.findOne(id);
    artist.galleryId = transferDto.targetGalleryId;
    artist.enterAt = transferDto.enterAt ? new Date(transferDto.enterAt) : new Date();

    return this.artistRepository.save(artist);
  }

  async remove(id: string, currentUser: UserType): Promise<{ message: string }> {
    const artist = await this.findOne(id);

    if (currentUser.role !== UserRole.ADMIN && (currentUser.role === UserRole.GALLERY && artist.galleryId !== currentUser.id)) {
      throw new ForbiddenException('Unauthorized to remove this artist');
    }

    await this.artistRepository.remove(artist);
    return { message: `Artist ${id} successfully removed` };
  }
}
