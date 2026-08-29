import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { User } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/role.decorator';
import { UserRole } from '../common/enum';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('artist')
    @Roles(UserRole.ARTIST)
    getArtistStats(@User() user: any) {
        return this.reportsService.getArtistStats(user.id);
    }
    @Get('gallery')
    @Roles(UserRole.GALLERY)
    getGalleryStats(@User() user: any) {
        return this.reportsService.getGalleryStats(user.id);
    }

    @Get('admin')
    @Roles(UserRole.ADMIN)
    getAdminStats() {
        return this.reportsService.getAdminStats();
    }
}