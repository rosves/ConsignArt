import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUUID,
  IsUrl,
  IsObject,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ArtworkTechnics } from 'src/common/enum';
import type { Dimensions } from 'src/common/value-object';

@ValidatorConstraint({ name: 'IsReservePriceValid', async: false })
export class IsReservePriceValidConstraint implements ValidatorConstraintInterface {
  validate(reservePrice: number, args: ValidationArguments) {
    const obj = args.object as CreateArtworkDto;
    return obj.sellPrice >= reservePrice;
  }

  defaultMessage() {
    return 'sellPrice must be greater than or equal to reservePrice';
  }
}

export class CreateArtworkDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1000)
  creationYear!: number;

  @IsEnum(ArtworkTechnics)
  technic!: ArtworkTechnics;

  @IsObject()
  @IsOptional()
  dimensions?: Dimensions;

  @IsInt()
  @Min(0)
  sellPrice!: number;

  @IsInt()
  @Min(0)
  @Validate(IsReservePriceValidConstraint)
  reservePrice!: number;

  @IsUrl()
  @IsOptional()
  imageURL?: string;

  @IsUUID()
  @IsNotEmpty()
  artistId!: string;
}
