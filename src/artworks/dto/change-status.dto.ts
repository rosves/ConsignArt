import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArtworkStatus } from 'src/common/enum';

export class ChangeArtworkStatusDto {
  @ApiProperty({ example: ArtworkStatus.ON_LOAN, enum: ArtworkStatus })
  @IsEnum(ArtworkStatus)
  @IsNotEmpty()
  toStatus!: ArtworkStatus;

  @ApiProperty({ example: 'Prêt temporaire pour exposition', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
