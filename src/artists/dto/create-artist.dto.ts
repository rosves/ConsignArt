import { IsString, IsOptional, IsUrl, IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArtistDto {
  @ApiProperty({ example: 'Claude' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Monet' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'Peintre impressionniste français.', required: false })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({ example: 'https://monet-art.com', required: false })
  @IsUrl()
  @IsOptional()
  portfolioURL?: string;

  @ApiProperty({ example: 'Française', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  enterAt?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', required: false })
  @IsUUID()
  @IsOptional()
  galleryId?: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', required: false })
  @IsUUID()
  @IsOptional()
  userAccountId?: string;
}
