import { SalePriceValidationPipe } from './sale-price-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('SalePriceValidationPipe', () => {
  let pipe: SalePriceValidationPipe;

  beforeEach(() => {
    pipe = new SalePriceValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw BadRequestException if salePrice <= 0', () => {
    expect(() => pipe.transform({ salePrice: 0, artworkId: 'uuid', buyerId: 'uuid' }, {} as any))
      .toThrow(BadRequestException);
  });

  it('should return the value if salePrice > 0', () => {
    const dto = { salePrice: 1000000, artworkId: 'uuid', buyerId: 'uuid' };
    expect(pipe.transform(dto, {} as any)).toEqual(dto);
  });
});