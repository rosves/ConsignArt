import { Test, TestingModule } from '@nestjs/testing';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';
import { DataSource } from 'typeorm';

describe('ArtworksController', () => {
  let controller: ArtworksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtworksController],
      providers: [
        {
          provide: ArtworksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            changeStatus: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              findOne: jest.fn(),
              count: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ArtworksController>(ArtworksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
