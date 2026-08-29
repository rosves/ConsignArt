import { Test, TestingModule } from '@nestjs/testing';
import { ExhibitionsController } from './exhibitions.controller';
import { ExhibitionsService } from './exhibitions.service';

describe('ExhibitionsController', () => {
  let controller: ExhibitionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExhibitionsController],
      providers: [
        {
          provide: ExhibitionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            closeExhibition: jest.fn(),
            createLoan: jest.fn(),
            returnLoan: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExhibitionsController>(ExhibitionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
