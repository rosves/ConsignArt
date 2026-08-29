import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ArtworksService } from './artworks.service';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';
import { ArtworkStatus, ArtworkTechnics, UserRole } from 'src/common/enum';
import type { UserType } from 'src/auth/type/jwtPayload';

describe('ArtworksService', () => {
  let service: ArtworksService;

  const mockArtwork = {
    id: 'artwork-uuid-1',
    title: 'Mona Lisa',
    creationYear: 1503,
    technic: ArtworkTechnics.OIL,
    sellPrice: 100000,
    reservePrice: 80000,
    status: ArtworkStatus.AVAILABLE,
    artistId: 'artist-uuid-1',
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockImplementation((entity, dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'saved-id', ...entity })),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockArtworkRepo = {
    create: jest.fn().mockReturnValue(mockArtwork),
    save: jest.fn().mockResolvedValue(mockArtwork),
    findOne: jest.fn().mockResolvedValue({ ...mockArtwork }),
    remove: jest.fn().mockResolvedValue(mockArtwork),
  };

  const mockHistoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworksService,
        { provide: getRepositoryToken(Artwork), useValue: mockArtworkRepo },
        { provide: getRepositoryToken(ArtworkStatusHistory), useValue: mockHistoryRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ArtworksService>(ArtworksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an artwork with AVAILABLE status and initial history entry in transaction', async () => {
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const dto = {
        title: 'Mona Lisa',
        creationYear: 1503,
        technic: ArtworkTechnics.OIL,
        sellPrice: 100000,
        reservePrice: 80000,
        artistId: 'artist-uuid-1',
      };

      const result = await service.create(dto, user);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.status).toBe(ArtworkStatus.AVAILABLE);
    });
  });

  describe('changeStatus', () => {
    it('should transition AVAILABLE to ON_LOAN', async () => {
      mockArtworkRepo.findOne.mockResolvedValueOnce({ ...mockArtwork, status: ArtworkStatus.AVAILABLE });
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      const result = await service.changeStatus('artwork-uuid-1', { toStatus: ArtworkStatus.ON_LOAN }, user);
      expect(result.status).toBe(ArtworkStatus.ON_LOAN);
    });

    it('should throw BadRequestException when transitioning from SOLD directly to AVAILABLE', async () => {
      mockArtworkRepo.findOne.mockResolvedValueOnce({ ...mockArtwork, status: ArtworkStatus.SOLD });
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      await expect(
        service.changeStatus('artwork-uuid-1', { toStatus: ArtworkStatus.AVAILABLE }, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow only ADMIN to transition from SOLD to RETURNED', async () => {
      mockArtworkRepo.findOne.mockResolvedValueOnce({ ...mockArtwork, status: ArtworkStatus.SOLD });
      const galleryUser: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      await expect(
        service.changeStatus('artwork-uuid-1', { toStatus: ArtworkStatus.RETURNED }, galleryUser),
      ).rejects.toThrow(BadRequestException);

      mockArtworkRepo.findOne.mockResolvedValueOnce({ ...mockArtwork, status: ArtworkStatus.SOLD });
      const adminUser: UserType = { id: 'admin-uuid-1', role: UserRole.ADMIN };

      const result = await service.changeStatus('artwork-uuid-1', { toStatus: ArtworkStatus.RETURNED }, adminUser);
      expect(result.status).toBe(ArtworkStatus.RETURNED);
    });
  });

  describe('remove (Suppression / Delete)', () => {
    it('should remove an existing artwork', async () => {
      const result = await service.remove('artwork-uuid-1');

      expect(mockArtworkRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'artwork-uuid-1' },
        relations: { artist: true, statusHistories: true },
      });
      expect(mockArtworkRepo.remove).toHaveBeenCalled();
      expect(result.message).toContain('successfully removed');
    });
  });
});