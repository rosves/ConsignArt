import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsService } from './artists.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { Artist } from 'src/Entities/artist-entity';
import { UserRole, ArtistStatus } from 'src/common/enum';
import { ForbiddenException } from '@nestjs/common';
import type { UserType } from 'src/auth/type/jwtPayload';

type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T> | 'createQueryBuilder', jest.Mock>>;

describe('ArtistsService', () => {
  let service: ArtistsService;
  let mockArtistRepo: MockRepository<Artist>;

  const mockArtist = {
    id: 'artist-uuid-1',
    firstName: 'Claude',
    lastName: 'Monet',
    status: ArtistStatus.ACTIVE,
    galleryId: 'gallery-uuid-1',
  };

  beforeEach(async () => {
    mockArtistRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((artist) => Promise.resolve({ id: 'artist-uuid-1', ...artist })),
      findOne: jest.fn().mockResolvedValue({ ...mockArtist }),
      remove: jest.fn().mockResolvedValue(mockArtist),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockArtist]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        {
          provide: getRepositoryToken(Artist),
          useValue: mockArtistRepo,
        },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (Insertion)', () => {
    it('should create and save a new artist attached to gallery', async () => {
      const currentUser: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const dto = { firstName: 'Claude', lastName: 'Monet' };

      const result = await service.create(dto, currentUser);

      expect(mockArtistRepo.create).toHaveBeenCalledWith(dto);
      expect(mockArtistRepo.save).toHaveBeenCalled();
      expect(result.galleryId).toBe('gallery-uuid-1');
      expect(result.status).toBe(ArtistStatus.ACTIVE);
    });
  });

  describe('update (Modification)', () => {
    it('should update artist details if belonging to the gallery', async () => {
      const currentUser: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const updateDto = { biography: 'New biography' };

      const result = await service.update('artist-uuid-1', updateDto, currentUser);

      expect(result.biography).toBe('New biography');
      expect(mockArtistRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if gallery tries to update another gallery artist', async () => {
      const otherGalleryUser: UserType = { id: 'other-gallery-id', role: UserRole.GALLERY };
      const updateDto = { biography: 'New biography' };

      await expect(service.update('artist-uuid-1', updateDto, otherGalleryUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferGallery (Règle métier transfert)', () => {
    it('should allow ADMIN to transfer artist to another gallery', async () => {
      const adminUser: UserType = { id: 'admin-uuid-1', role: UserRole.ADMIN };
      const transferDto = { targetGalleryId: 'new-gallery-uuid' };

      const result = await service.transferGallery('artist-uuid-1', transferDto, adminUser);

      expect(result.galleryId).toBe('new-gallery-uuid');
      expect(mockArtistRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if GALLERY user tries to transfer an artist', async () => {
      const galleryUser: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const transferDto = { targetGalleryId: 'new-gallery-uuid' };

      await expect(service.transferGallery('artist-uuid-1', transferDto, galleryUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove (Suppression / Delete)', () => {
    it('should delete artist if belonging to gallery or ADMIN', async () => {
      const galleryUser: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      const result = await service.remove('artist-uuid-1', galleryUser);

      expect(mockArtistRepo.remove).toHaveBeenCalled();
      expect(result.message).toContain('successfully removed');
    });

    it('should throw ForbiddenException if gallery tries to delete an artist from another gallery', async () => {
      const otherGalleryUser: UserType = { id: 'other-gallery-id', role: UserRole.GALLERY };

      await expect(service.remove('artist-uuid-1', otherGalleryUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
