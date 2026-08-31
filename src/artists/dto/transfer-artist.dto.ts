import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferArtistDto {
  @ApiProperty({ example: 'target-gallery-uuid-1234-5678' })
  @IsUUID()
  @IsNotEmpty()
  targetGalleryId!: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  enterAt?: string;
}
