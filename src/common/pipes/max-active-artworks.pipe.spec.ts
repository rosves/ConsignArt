import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MaxActiveArtworksPipe } from './max-active-artworks.pipe';
import { ArtworkTechnics } from '../enum';

describe('MaxActiveArtworksPipe', () => {
  let pipe: MaxActiveArtworksPipe;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        count: jest.fn(),
      }),
    };
    pipe = new MaxActiveArtworksPipe(mockDataSource as unknown as DataSource);
  });

  const createDto = {
    title: 'Starry Night',
    creationYear: 1889,
    technic: ArtworkTechnics.OIL,
    sellPrice: 50000,
    reservePrice: 40000,
    artistId: 'artist-uuid-1',
  };

  it('should pass if artist has fewer than 50 active artworks', async () => {
    mockDataSource.getRepository().count.mockResolvedValue(49);
    const result = await pipe.transform(createDto);
    expect(result).toEqual(createDto);
  });

  it('should throw BadRequestException if artist has 50 active artworks', async () => {
    mockDataSource.getRepository().count.mockResolvedValue(50);
    await expect(pipe.transform(createDto)).rejects.toThrow(BadRequestException);
  });
});