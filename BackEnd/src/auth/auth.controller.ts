import { Controller, Body, Post, Get, Request, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './DTO/sign-in.dto';
import { BaseSignUpDTO } from './DTO/base-sign-up.dto';
import { Public } from './public.decorator';
import type { UserId } from 'src/domain/ids';
import { ForgotPasswordDTO } from './DTO/forgot-password.dto';
import { ResetPasswordDTO } from './DTO/reset-password.dto';
import { VerifyEmailDTO } from './DTO/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  signIn(@Body() signinDto: SignInDTO) {
    return this.authService.signIn(signinDto);
  }

  @Public()
  @Post('signup')
  signUp(@Body() baseSignUpDto: BaseSignUpDTO) {
    return this.authService.signup(baseSignUpDto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDTO) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('sendEmail/:userId')
  sendEmail(@Param('userId') userId: UserId) {
    console.log(userId);
    return this.authService.sendEmailVerification(userId);
  }
}
