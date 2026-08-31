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

import { ApiProperty } from '@nestjs/swagger';

export class CreateArtworkDto {
  @ApiProperty({ example: 'Nymphéas' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Peinture à l huile sur toile de grand format.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1914 })
  @IsInt()
  @Min(1000)
  creationYear!: number;

  @ApiProperty({ example: ArtworkTechnics.OIL, enum: ArtworkTechnics })
  @IsEnum(ArtworkTechnics)
  technic!: ArtworkTechnics;

  @ApiProperty({ example: { height: 200, width: 200, depth: 5 }, required: false })
  @IsObject()
  @IsOptional()
  dimensions?: Dimensions;

  @ApiProperty({ example: 1500000, description: 'Prix de vente en centimes d euros (15 000.00 €)' })
  @IsInt()
  @Min(0)
  sellPrice!: number;

  @ApiProperty({ example: 1200000, description: 'Prix plancher de réserve en centimes d euros (12 000.00 €)' })
  @IsInt()
  @Min(0)
  @Validate(IsReservePriceValidConstraint)
  reservePrice!: number;

  @ApiProperty({ example: 'https://example.com/nympheas.jpg', required: false })
  @IsUrl()
  @IsOptional()
  imageURL?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsNotEmpty()
  artistId!: string;
}
