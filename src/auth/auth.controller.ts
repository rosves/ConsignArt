import { Body, Controller, Post, Res, Patch, Req, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from 'src/users/dto/createUserDTO';
import { LoginDTO } from 'src/users/dto/loginDTO';
import type { Response, Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

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
  async register( @Body() dto : CreateUserDTO, @Res() res: Response ) : Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setCookie(res, accessToken, refreshToken);
    return res.json({ message: 'Register successful' });
  }

  @Post('login')
  @Public()
  async login( @Body() dto : LoginDTO, @Res() res: Response ) : Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setCookie(res, accessToken, refreshToken);
    return res.json({ message: 'login successful' });
  }

  @Post('refreshToken')
  async refreshToken(@Req() req : Request, @Res() res: Response ) : Promise<Response> { 
    const oldRefreshToken = req.cookies['refreshToken'];

    if(!oldRefreshToken){
      throw new  NotFoundException('No refreshToken found !');
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(oldRefreshToken);

    this.setCookie(res, accessToken, refreshToken);

    return res.json({ message: 'Token refresh succesfully !' });
  }

  @Post('logout')
  async logout(@Req() req : Request, @Res() res: Response ) : Promise<Response> { 
    const acessToken = req.cookies['accessToken'];

    if(!acessToken){
      throw new  NotFoundException('You are not authorized !');
    }

    await this.authService.logout(acessToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({ message: 'Logout succesfully !' });
  }
}
