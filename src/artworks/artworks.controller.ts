import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ArtworksService } from './artworks.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { ChangeArtworkStatusDto } from './dto/change-status.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OwnershipGuard } from 'src/common/guards/ownership.guard';
import { MaxActiveArtworksPipe } from 'src/common/pipes/max-active-artworks.pipe';
import { UserRole, ArtworkStatus } from 'src/common/enum';
import type { UserType } from 'src/auth/type/jwtPayload';

@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  @Post()
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UsePipes(MaxActiveArtworksPipe)
  create(@Body() createArtworkDto: CreateArtworkDto, @User() currentUser: UserType) {
    return this.artworksService.create(createArtworkDto, currentUser);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: ArtworkStatus,
    @Query('artistId') artistId?: string,
  ) {
    return this.artworksService.findAll(status, artistId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.artworksService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(OwnershipGuard)
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeArtworkStatusDto,
    @User() currentUser: UserType,
  ) {
    return this.artworksService.changeStatus(id, changeStatusDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.artworksService.remove(id);
  }
}
