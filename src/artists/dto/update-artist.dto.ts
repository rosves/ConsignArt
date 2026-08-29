import { PartialType } from '@nestjs/mapped-types';
import { CreateArtistDto } from './create-artist.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ArtistStatus } from 'src/common/enum';

export class UpdateArtistDto extends PartialType(CreateArtistDto) {
  @IsEnum(ArtistStatus)
  @IsOptional()
  status?: ArtistStatus;
}
