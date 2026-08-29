import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale } from '../Entities/sale-entity';
import { Artwork } from '../Entities/artwork-entity';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Artwork),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('calculateCommissionRate', () => {
    it('should return 40% for price <= 500000', () => {
      expect((service as any).calculateCommissionRate(500000)).toBe(40);
    });

    it('should return 35% for price between 500000 and 2000000', () => {
      expect((service as any).calculateCommissionRate(1000000)).toBe(35);
    });

    it('should return 30% for price > 2000000', () => {
      expect((service as any).calculateCommissionRate(2500000)).toBe(30);
    });
  });

  describe('calculateCommissionAmount', () => {
    it('should calculate commission correctly', () => {
      expect((service as any).calculateCommissionAmount(1000000, 35)).toBe(350000);
    });
  });

  describe('calculateArtistAmount', () => {
    it('should calculate artist amount correctly', () => {
      expect((service as any).calculateArtistAmount(1000000, 350000)).toBe(650000);
    });
  });
});