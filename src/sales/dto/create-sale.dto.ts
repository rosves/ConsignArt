import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateSaleDto {
  @IsUUID()
  artworkId!: string;

  @IsUUID()
  buyerId!: string;

  @IsInt()
  @Min(1)
  salePrice!: number;
}