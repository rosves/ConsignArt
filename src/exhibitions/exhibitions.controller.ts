import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ExhibitionsService } from './exhibitions.service';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserRole, ExhibitionType } from 'src/common/enum';
import type { UserType } from 'src/auth/type/jwtPayload';

@Controller('exhibitions')
export class ExhibitionsController {
  constructor(private readonly exhibitionsService: ExhibitionsService) {}

  @Post()
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  create(@Body() createExhibitionDto: CreateExhibitionDto, @User() currentUser: UserType) {
    return this.exhibitionsService.create(createExhibitionDto, currentUser);
  }

  @Get()
  @Public()
  findAll(
    @Query('galleryId') galleryId?: string,
    @Query('type') type?: ExhibitionType,
  ) {
    return this.exhibitionsService.findAll(galleryId, type);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.exhibitionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExhibitionDto: UpdateExhibitionDto,
    @User() currentUser: UserType,
  ) {
    return this.exhibitionsService.update(id, updateExhibitionDto, currentUser);
  }

  @Post(':id/close')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  close(@Param('id', ParseUUIDPipe) id: string, @User() currentUser: UserType) {
    return this.exhibitionsService.closeExhibition(id, currentUser);
  }

  @Post('loans')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  createLoan(@Body() createLoanDto: CreateLoanDto, @User() currentUser: UserType) {
    return this.exhibitionsService.createLoan(createLoanDto, currentUser);
  }

  @Post('loans/:id/return')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  returnLoan(@Param('id', ParseUUIDPipe) id: string, @User() currentUser: UserType) {
    return this.exhibitionsService.returnLoan(id, currentUser);
  }
}
