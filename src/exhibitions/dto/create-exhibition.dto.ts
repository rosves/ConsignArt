import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ExhibitionType } from 'src/common/enum';

@ValidatorConstraint({ name: 'IsEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const obj = args.object as CreateExhibitionDto;
    if (!obj.startDate || !endDate) return true;
    return new Date(endDate) >= new Date(obj.startDate);
  }

  defaultMessage() {
    return 'endDate must be greater than or equal to startDate';
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateExhibitionDto {
  @ApiProperty({ example: 'Rétrospective Impressionnisme' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-10-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate!: string;

  @ApiProperty({ example: 'Paris - Grand Palais', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: ExhibitionType.PHYSICAL, enum: ExhibitionType })
  @IsEnum(ExhibitionType)
  @IsNotEmpty()
  type!: ExhibitionType;

  @ApiProperty({ example: 'Grande exposition d art contemporain.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', required: false })
  @IsUUID()
  @IsOptional()
  galleryId?: string;

  @ApiProperty({ example: ['6dd038a1-91bb-48f5-9323-e41f7ed39bb7'], type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'An exhibition must contain at least one artwork' })
  @IsUUID('4', { each: true, message: 'Each artwork ID must be a valid UUID' })
  artworkIds!: string[];
}
