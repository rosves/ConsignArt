import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/common/enum';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class AdminService {
    constructor(
        private userService : UsersService
    ){
    }

    public async activateGallery(userId : string) : Promise<void> {
        
        const user = await this.userService.findById(userId);

        if(!user) {
            throw new NotFoundException('User not found !');
        }

        if(user.role !== UserRole.GALLERY ){
            throw new BadRequestException('This user is not allowed');
        }

        if(user.isActive){
            throw new BadRequestException('This user is already active');
        }
        
        await this.userService.ActiveGalleryAccount(userId);

    }

}
