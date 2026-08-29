import { Controller, Post, Body } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Roles } from '../common/decorators/role.decorator';
import { UserRole } from '../common/enum';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.GALLERY)
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }
}