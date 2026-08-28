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

export class CreateExhibitionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(ExhibitionType)
  @IsNotEmpty()
  type!: ExhibitionType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  galleryId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'An exhibition must contain at least one artwork' })
  @IsUUID('4', { each: true, message: 'Each artwork ID must be a valid UUID' })
  artworkIds!: string[];
}
