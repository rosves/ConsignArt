import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({ example: '6dd038a1-91bb-48f5-9323-e41f7ed39bb7' })
  @IsUUID()
  artworkId!: string;

  @ApiProperty({ example: 'buyer-uuid-1234-5678' })
  @IsUUID()
  buyerId!: string;

  @ApiProperty({ example: 1500000, description: 'Prix de vente en centimes d euros (15 000.00 €)' })
  @IsInt()
  @Min(1)
  salePrice!: number;
}