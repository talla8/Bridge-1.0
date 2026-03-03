import { Controller, Body, Post, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './DTO/sign-in.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  signIn(@Body() signinDto: SignInDTO) {
    return this.authService.signIn(signinDto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
