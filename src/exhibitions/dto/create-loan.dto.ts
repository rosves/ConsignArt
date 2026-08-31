import { IsUUID, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({ example: '6dd038a1-91bb-48f5-9323-e41f7ed39bb7' })
  @IsUUID()
  @IsNotEmpty()
  artworkId!: string;

  @ApiProperty({ example: 'borrower-gallery-uuid-1234' })
  @IsUUID()
  @IsNotEmpty()
  borrowerGalleryId!: string;

  @ApiProperty({ example: 'exhibition-uuid-5678', required: false })
  @IsUUID()
  @IsOptional()
  exhibitionId?: string;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ example: 'Transport sous température contrôlée et assurance tous risques.', required: false })
  @IsString()
  @IsOptional()
  conditions?: string;
}
