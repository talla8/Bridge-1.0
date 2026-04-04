import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDTO } from './DTO/sign-in.dto';
import { BaseSignUpDTO } from './DTO/base-sign-up.dto';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { TeacherSignUpDTO } from './DTO/teacher-sign-up.dto';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';
import { RoleId, User } from 'src/domain/user';
import { ParentSignUpDTO } from './DTO/parent-sign-up.dto';
import { UserId } from 'src/domain/ids';
import { VerificationService } from './verification.service';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { ForgotPasswordDTO } from './DTO/forgot-password.dto';
import { ResetPasswordDTO } from './DTO/reset-password.dto';
import { VerificationTokenType } from 'src/domain/verificationToken';
import { VerifyEmailDTO } from './DTO/verify-email.dto';

// we use @UseGuards(RolesGuard) on top of the controller so we can use a specific guard
//on top of any method or route we use @Roles() to determine the roles allowd to use this specific routes so both are used for
//difiiernete purposes

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly gradesRepo: InMemoryGradesRepo,
    private readonly verificationService: VerificationService,
    private readonly studentsRepo: InMemoryStudentsRepo,
  ) {}

  async signIn(signInDto: SignInDTO): Promise<{ access_token: string }> {
    const user = await this.usersService.findbyEmail(signInDto.email); //we store the user in this variable

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('wrong email or password');
    }
    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };
    return { access_token: await this.jwtService.signAsync(payload) }; //this is what we combine with the jwt secret key as our token
    //its an object that has the key access_token with the value of a promise
    // const {password , ...result} = user; //restructuring
  }

  async createBaseUser(
    baseSignUpDto: BaseSignUpDTO,
    role: RoleId,
  ): Promise<User> {
    const existingUser = await this.usersService.findbyEmail(
      baseSignUpDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    } // we already have this check in the original method

    const userId = `user_${randomUUID()}`;
    const saltOrRounds = 10;
    const password = baseSignUpDto.password;
    const user = await this.usersService.create({
      ...baseSignUpDto,
      email: baseSignUpDto.email,
      roleId: role,
      passwordHash: await bcrypt.hash(password, saltOrRounds),
      userId,
      fullName: baseSignUpDto.userFullName,
      isActive: true,
      isVerified: false,
    });

    if (!user) {
      throw new InternalServerErrorException('Unable to create account');
    }

    return user;
  }

  async signup(
    baseSignUpDto: BaseSignUpDTO,
  ): Promise<{ access_token: string }> {
    if (!baseSignUpDto.role) {
      throw new ConflictException('Role is required');
    }

    const user = await this.createBaseUser(baseSignUpDto, baseSignUpDto.role);
    await this.verificationService.sendEmail(user.userId, user.email);

    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async teacherSignUp(
    teacherSignUpDTO: TeacherSignUpDTO,
  ): Promise<{ access_token: string }> {
    const user = await this.createBaseUser(
      {
        userFullName: teacherSignUpDTO.userFullName,
        email: teacherSignUpDTO.email,
        phoneNumber: teacherSignUpDTO.phoneNumber,
        password: teacherSignUpDTO.password,
      },
      RoleId.TEACHER,
    );
    await this.verificationService.sendEmail(user.userId, user.email);

    await this.gradesRepo.create({
      gradeId: teacherSignUpDTO.grade,
      gradeName: teacherSignUpDTO.grade,
      schoolName: teacherSignUpDTO.school, //check this
      teacherId: user.userId,
    });

    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async parentSignUp(
    //students should be created first
    parentSignUpDto: ParentSignUpDTO,
  ): Promise<{ access_token: any }> {
    const user = await this.createBaseUser(
      {
        userFullName: parentSignUpDto.userFullName,
        email: parentSignUpDto.email,
        phoneNumber: parentSignUpDto.phoneNumber,
        password: parentSignUpDto.password,
      },
      RoleId.PARENT,
    );
    await this.verificationService.sendEmail(user.userId, user.email);
    const child = await this.studentsRepo.findById(
      parentSignUpDto.studentNationalId,
    ); //change the method here
    if (!child) {
      throw new NotFoundException('Student is not Found');
    }
    await this.studentsRepo.update(child.studentId, {
      parentId: `parent-${randomUUID()}`,
      parentRelation: parentSignUpDto.parentType,
    });
    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async sendEmailVerification(userId: UserId): Promise<any> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const email = user.email;

    return this.verificationService.sendEmail(user.userId, email);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDTO,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findbyEmail(forgotPasswordDto.email);

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    await this.verificationService.sendPasswordResetEmail(
      user.userId,
      user.email,
    );

    return { message: 'Password reset email sent successfully.' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDTO,
  ): Promise<{ message: string }> {
    const userId = await this.verificationService.findTokenOwner(
      resetPasswordDto.token,
      VerificationTokenType.PASSWORD_RESET,
    );

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const isTokenValid = await this.verificationService.consumeToken(
      userId,
      resetPasswordDto.token,
      VerificationTokenType.PASSWORD_RESET,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.usersService.update(userId, {
      passwordHash: await bcrypt.hash(resetPasswordDto.newPassword, 10),
    });

    return { message: 'Password has been reset successfully.' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDTO,
  ): Promise<{ message: string }> {
    const userId = await this.verificationService.findTokenOwner(
      verifyEmailDto.token,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const isTokenValid = await this.verificationService.consumeToken(
      userId,
      verifyEmailDto.token,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const user = await this.usersService.update(userId, {
      isVerified: true,
    });

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    return { message: 'Email has been verified successfully.' };
  }
}

// forgotPassword
// resetPassword
