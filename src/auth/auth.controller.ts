import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from 'src/users/dto/createUserDTO';
import { LoginDTO } from 'src/users/dto/loginDTO';
import type { Response } from 'express';

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
  async register( @Body() dto : CreateUserDTO, @Res() res: Response ) : Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setCookie(res, accessToken, refreshToken);
    return res.json({ message: 'Register successful' });
  }

  @Post('login')
  async login( @Body() dto : LoginDTO, @Res() res: Response ) : Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setCookie(res, accessToken, refreshToken);
    return res.json({ message: 'login successful' });
  }
}
