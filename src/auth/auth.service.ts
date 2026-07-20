import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common/enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private userService : UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    private generateTokens(userId : string, role : UserRole) : Promise<{ accessToken: string, refreshToken: string }> {
        
    }
}