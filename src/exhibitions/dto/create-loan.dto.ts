import { IsUUID, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLoanDto {
  @IsUUID()
  @IsNotEmpty()
  artworkId!: string;

  @IsUUID()
  @IsNotEmpty()
  borrowerGalleryId!: string;

  @IsUUID()
  @IsOptional()
  exhibitionId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsOptional()
  conditions?: string;
}
