import { BadRequestException, Controller, Param, Post, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/common/enum';

@ApiTags('admin')
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users/:id/activate')
  @HttpCode(200)
  async activateGallery(@Param('id') id : string) {

    await this.adminService.activateGallery(id);

    return { message: 'Gallery activate succesfully !' };
  }
}
