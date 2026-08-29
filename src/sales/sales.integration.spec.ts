import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController (integration)', () => {
  let app: INestApplication;

  const mockSalesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        { provide: SalesService, useValue: mockSalesService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /sales → should create a sale', async () => {
    const dto = {
      artworkId: '550e8400-e29b-41d4-a716-446655440000',
      buyerId: '550e8400-e29b-41d4-a716-446655440001',
      salePrice: 1000000,
    };

    mockSalesService.create.mockResolvedValue({ id: 'uuid', ...dto });

    await request(app.getHttpServer())
      .post('/sales')
      .send(dto)
      .expect(201);
  });

  it('POST /sales → should return 400 if body is invalid', async () => {
    await request(app.getHttpServer())
      .post('/sales')
      .send({ salePrice: 'not-a-number' })
      .expect(400);
  });
});