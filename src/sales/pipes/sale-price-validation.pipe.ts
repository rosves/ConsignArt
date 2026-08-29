import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from '../dto/create-sale.dto';

@Injectable()
export class SalePriceValidationPipe implements PipeTransform {
  transform(value: CreateSaleDto, metadata: ArgumentMetadata) {
    if (value.salePrice <= 0) {
      throw new BadRequestException('Sale price must be greater than 0');
    }
    return value;
  }
}