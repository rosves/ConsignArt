import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { TransferArtistDto } from './dto/transfer-artist.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserRole, ArtistStatus } from 'src/common/enum';
import type { UserType } from 'src/auth/type/jwtPayload';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  create(@Body() createArtistDto: CreateArtistDto, @User() currentUser: UserType) {
    return this.artistsService.create(createArtistDto, currentUser);
  }

  @Get()
  @Public()
  findAll(
    @Query('galleryId') galleryId?: string,
    @Query('status') status?: ArtistStatus,
  ) {
    return this.artistsService.findAll(galleryId, status);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArtistDto: UpdateArtistDto,
    @User() currentUser: UserType,
  ) {
    return this.artistsService.update(id, updateArtistDto, currentUser);
  }

  @Patch(':id/status')
  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ArtistStatus,
    @User() currentUser: UserType,
  ) {
    return this.artistsService.changeStatus(id, status, currentUser);
  }

  @Post(':id/transfer')
  @Roles(UserRole.ADMIN)
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() transferDto: TransferArtistDto,
    @User() currentUser: UserType,
  ) {
    return this.artistsService.transferGallery(id, transferDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @User() currentUser: UserType) {
    return this.artistsService.remove(id, currentUser);
  }
}
