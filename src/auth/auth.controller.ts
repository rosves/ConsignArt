import { Body, Controller, Post, Res, Patch, Req, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from 'src/users/dto/createUserDTO';
import { LoginDTO } from 'src/users/dto/loginDTO';
import type { Response, Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { User } from 'src/common/decorators/user.decorator';
import type { UserType } from './type/jwtPayload';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookie(res : Response, accessToken : string, refreshToken : string) : void {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
  }


  @Post('register')
  @Public()
  async register( @Body() dto : CreateUserDTO, @Res({ passthrough : true}) res: Response ){
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setCookie(res, accessToken, refreshToken);
    return { message: 'Register successful' };
  }

  @Post('login')
  @Public()
  async login( @Body() dto : LoginDTO, @Res({ passthrough : true}) res: Response ){
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setCookie(res, accessToken, refreshToken);
    return { message: 'login successful' };
  }

  @Post('refreshToken')
  async refreshToken(@Req() req : Request, @Res({ passthrough : true}) res: Response ){ 
    const oldRefreshToken = req.cookies['refreshToken'];

    if(!oldRefreshToken){
      throw new  NotFoundException('No refreshToken found !');
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(oldRefreshToken);

    this.setCookie(res, accessToken, refreshToken);

    return { message: 'Token refresh succesfully !' };
  }

  @Post('logout')
  async logout(@User() user : UserType, @Res({ passthrough : true}) res: Response ){ 
    await this.authService.logout(user.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message : 'Logout succesfully !' };
  }
}
