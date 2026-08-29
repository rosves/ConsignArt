import { Test, TestingModule } from '@nestjs/testing';
import { ExhibitionsService } from './exhibitions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, ObjectLiteral } from 'typeorm';
import { Exhibition } from 'src/Entities/exhibition-entity';
import { Loan } from 'src/Entities/loan-entity';
import { Artwork } from 'src/Entities/artwork-entity';
import { ArtworkStatusHistory } from 'src/Entities/artworkStatusHistory-entity';
import { ArtworkStatus, UserRole, ExhibitionType } from 'src/common/enum';
import { BadRequestException } from '@nestjs/common';
import type { UserType } from 'src/auth/type/jwtPayload';

type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('ExhibitionsService', () => {
  let service: ExhibitionsService;
  let mockArtworkRepo: MockRepository<Artwork>;
  let mockExhibitionRepo: MockRepository<Exhibition>;
  let mockLoanRepo: MockRepository<Loan>;
  let mockQueryRunner: Partial<QueryRunner>;

  const mockArtwork = {
    id: 'artwork-uuid-1',
    title: 'Nymphéas',
    status: ArtworkStatus.AVAILABLE,
  };

  const mockExhibition = {
    id: 'exhibition-uuid-1',
    name: 'Impressionnisme',
    galleryId: 'gallery-uuid-1',
    artworks: [{ ...mockArtwork, status: ArtworkStatus.ON_LOAN }],
  };

  beforeEach(async () => {
    mockArtworkRepo = {
      find: jest.fn().mockResolvedValue([{ ...mockArtwork }]),
      findOne: jest.fn().mockResolvedValue({ ...mockArtwork }),
    };

    mockExhibitionRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((ex) => Promise.resolve({ id: 'exhibition-uuid-1', ...ex })),
      findOne: jest.fn().mockResolvedValue({ ...mockExhibition }),
    };

    mockLoanRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((loan) => Promise.resolve({ id: 'loan-uuid-1', ...loan })),
      findOne: jest.fn().mockResolvedValue({ id: 'loan-uuid-1', returnedAt: null, artwork: { ...mockArtwork, status: ArtworkStatus.ON_LOAN } }),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockImplementation((entity, dto) => dto),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'saved-id', ...entity })),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExhibitionsService,
        { provide: getRepositoryToken(Exhibition), useValue: mockExhibitionRepo },
        { provide: getRepositoryToken(Loan), useValue: mockLoanRepo },
        { provide: getRepositoryToken(Artwork), useValue: mockArtworkRepo },
        { provide: getRepositoryToken(ArtworkStatusHistory), useValue: { create: jest.fn(), save: jest.fn() } },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) } },
      ],
    }).compile();

    service = module.get<ExhibitionsService>(ExhibitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (Exposition)', () => {
    it('should create exhibition and update artwork status to ON_LOAN in transaction', async () => {
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const dto = {
        name: 'Impressionnisme',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-10-01T00:00:00.000Z',
        type: ExhibitionType.PHYSICAL,
        artworkIds: ['artwork-uuid-1'],
      };

      const result = await service.create(dto, user);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.name).toBe('Impressionnisme');
    });

    it('should throw BadRequestException if any artwork is not AVAILABLE', async () => {
      (mockArtworkRepo.find as jest.Mock).mockResolvedValueOnce([{ ...mockArtwork, status: ArtworkStatus.ON_LOAN }]);
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const dto = {
        name: 'Impressionnisme',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-10-01T00:00:00.000Z',
        type: ExhibitionType.PHYSICAL,
        artworkIds: ['artwork-uuid-1'],
      };

      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('closeExhibition (Clôture d exposition)', () => {
    it('should close exhibition and return artworks to AVAILABLE status', async () => {
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      const result = await service.closeExhibition('exhibition-uuid-1', user);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.message).toContain('returned to AVAILABLE');
    });
  });

  describe('createLoan & returnLoan (Prêts inter-galeries)', () => {
    it('should create a loan for available artwork', async () => {
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };
      const loanDto = {
        artworkId: 'artwork-uuid-1',
        borrowerGalleryId: 'borrower-gallery-id',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-10-01T00:00:00.000Z',
      };

      const result = await service.createLoan(loanDto, user);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.borrowerGalleryId).toBe('borrower-gallery-id');
    });

    it('should return a loan and set artwork back to AVAILABLE', async () => {
      const user: UserType = { id: 'gallery-uuid-1', role: UserRole.GALLERY };

      const result = await service.returnLoan('loan-uuid-1', user);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.returnedAt).toBeDefined();
    });
  });
});
