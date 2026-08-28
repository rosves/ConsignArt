import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArtworkStatus } from 'src/common/enum';

export class ChangeArtworkStatusDto {
  @IsEnum(ArtworkStatus)
  @IsNotEmpty()
  toStatus!: ArtworkStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
