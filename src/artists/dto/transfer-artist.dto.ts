import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class TransferArtistDto {
  @IsUUID()
  @IsNotEmpty()
  targetGalleryId!: string;

  @IsDateString()
  @IsOptional()
  enterAt?: string;
}
