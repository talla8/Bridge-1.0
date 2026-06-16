import {
  Controller,
  Body,
  Post,
  Get,
  Request,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './DTO/sign-in.dto';
import { BaseSignUpDTO } from './DTO/base-sign-up.dto';
import { TeacherSignUpDTO } from './DTO/teacher-sign-up.dto';
import { ParentSignUpDTO } from './DTO/parent-sign-up.dto';
import { Public } from './public.decorator';
import type { UserId } from 'src/domain/ids';
import { ForgotPasswordDTO } from './DTO/forgot-password.dto';
import { ResetPasswordDTO } from './DTO/reset-password.dto';
import { VerifyEmailDTO } from './DTO/verify-email.dto';
import { UpdateProfileDTO } from './DTO/update-profile.dto';
import { ChangePasswordDTO } from './DTO/change-password.dto';
import { InstitutionSignUpDTO } from './DTO/institution-sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  signIn(@Body() signinDto: SignInDTO) {
    return this.authService.signIn(signinDto);
  }

  // @Public()
  // @Post('signup')
  // signUp(@Body() baseSignUpDto: BaseSignUpDTO) {
  //   return this.authService.signup(baseSignUpDto);
  // }

  @Public()
  @Post('signup/institution')
  institutionSignUp(@Body() institutionSignUpDto: InstitutionSignUpDTO) {
    return this.authService.institutionSignUp(institutionSignUpDto);
  }

  @Public()
  @Post('signup/teacher')
  teacherSignUp(@Body() teacherSignUpDto: TeacherSignUpDTO) {
    return this.authService.teacherSignUp(teacherSignUpDto);
  }

  @Public()
  @Post('signup/parent')
  parentSignUp(@Body() parentSignUpDto: ParentSignUpDTO) {
    return this.authService.parentSignUp(parentSignUpDto);
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

  @Post('resend-verification')
  resendVerification(@Request() req) {
    return this.authService.sendEmailVerification(req.user.sub);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDTO) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  @Post('change-password')
  changePassword(@Request() req, @Body() dto: ChangePasswordDTO) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  // @Get('sendEmail/:userId')
  // sendEmail(@Param('userId') userId: UserId) {
  //   console.log(userId);
  //   return this.authService.sendEmailVerification(userId);
  // } //comment: why not getting the userid fromthe request?
  // //answer: this method is not even used
  // //test the whole functionality with out this methos
}
