import { Test, TestingModule } from '@nestjs/testing';
import { ExhibitionsService } from './exhibitions.service';

describe('ExhibitionsService', () => {
  let service: ExhibitionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExhibitionsService],
    }).compile();

    service = module.get<ExhibitionsService>(ExhibitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
