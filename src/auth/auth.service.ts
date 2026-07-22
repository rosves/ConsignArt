import { ConflictException, Injectable,UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common/enum';
import { UsersService } from 'src/users/users.service';
import { JwtPaylaod } from './type/jwtPayload';
import { CreateUserDTO } from 'src/users/dto/createUserDTO';
import { hash, compare } from 'bcrypt';
import { LoginDTO } from 'src/users/dto/loginDTO';
@Injectable()
export class AuthService {
    constructor(
        private userService : UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    private async generateTokens(userId : string, role : UserRole) : Promise<{ accessToken: string, refreshToken: string }> {
        
        if(!userId || !role) {
            throw new Error('The user information are not provided !')
        }

        const paylaod : JwtPaylaod = {
            sub : userId,
            role : role
        }

        const accessToken = this.jwtService.sign(paylaod);
        const refreshToken = this.jwtService.sign(paylaod, {
            secret: this.configService.get('jwt.refreshSecret'),
            expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        })

        return {  accessToken, refreshToken }
    }

    public async refreshToken( refreshToken : string ) : Promise<{ accessToken : string, refreshToken : string}> {
        
        const secret = this.configService.get('jwt.refreshSecret');

        const IsTokenVerified = this.jwtService.verify(refreshToken);

        if(!IsTokenVerified){
            throw new UnauthorizedException('Your not allowed !');
        }

        const user = this.userService.findById(IsTokenVerified.sub)
    }

    public async register(dto: CreateUserDTO) : Promise<{ accessToken : string, refreshToken : string}> { 

        const IsEmailAlreadyExist = await this.userService.findByEmail(dto.email);

        if(IsEmailAlreadyExist) {
            throw new ConflictException('This email is already used !');
        }

        const hashedPassword = await hash(dto.password,10);

        const user = await this.userService.create({
            email : dto.email,
            password : hashedPassword,
            firstName : dto.firstName,
            lastName : dto.lastName,
            role : dto.role
        })

        const { accessToken, refreshToken } = await this.generateTokens(user.id,user.role);

        const hashedRefreshToken = await hash(refreshToken, 10);

        await this.userService.updateRefresToken(user.id, hashedRefreshToken)

        return { accessToken, refreshToken,  };
    }

    public async login(dto : LoginDTO) : Promise<{ accessToken : string, refreshToken : string}> {

        const user = await this.userService.findByEmail(dto.email);

        if(!user){
            throw new UnauthorizedException('Wrong Email or Password !');
        }

        const Password = await compare(dto.password, user.password);

        if(!Password){
            throw new UnauthorizedException('Wrong Email or Password !');
        }

        const { accessToken, refreshToken } = await this.generateTokens(user.id,user.role);

        const hashedRefreshToken = await hash(refreshToken, 10);

        await this.userService.updateRefresToken(user.id, hashedRefreshToken)

        return { accessToken, refreshToken };

    }
}