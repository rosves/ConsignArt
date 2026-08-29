import { IsString, IsOptional, IsUrl, IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsUrl()
  @IsOptional()
  portfolioURL?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsDateString()
  @IsOptional()
  enterAt?: string;

  @IsUUID()
  @IsOptional()
  galleryId?: string;

  @IsUUID()
  @IsOptional()
  userAccountId?: string;
}
