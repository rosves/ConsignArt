import { PartialType } from '@nestjs/swagger';
import { CreateArtistDto } from './create-artist.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArtistStatus } from 'src/common/enum';

export class UpdateArtistDto extends PartialType(CreateArtistDto) {
  @ApiProperty({ example: ArtistStatus.ACTIVE, enum: ArtistStatus, required: false })
  @IsEnum(ArtistStatus)
  @IsOptional()
  status?: ArtistStatus;
}
