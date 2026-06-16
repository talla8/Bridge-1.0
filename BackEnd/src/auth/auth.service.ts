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
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { RoleId, User } from 'src/domain/user';
import { ParentSignUpDTO } from './DTO/parent-sign-up.dto';
import { UserId } from 'src/domain/ids';
import { VerificationService } from './verification.service';
import { ForgotPasswordDTO } from './DTO/forgot-password.dto';
import { ResetPasswordDTO } from './DTO/reset-password.dto';
import { VerificationTokenType } from 'src/domain/verificationToken';
import { VerifyEmailDTO } from './DTO/verify-email.dto';
import { UpdateProfileDTO } from './DTO/update-profile.dto';
import { ChangePasswordDTO } from './DTO/change-password.dto';
import { SqlitePlansRepo } from 'src/database/sqlite-plan.repo';
import { SqliteSubjectOfferingsRepo } from 'src/database/sqlite-subject-offering.repo';
import { InMemorySubjectsRepo } from 'src/infrastructure/in-memory/in-memory-subject.repo';
import { StudentsService } from 'src/students/students.service';
import { InMemorySchoolsRepo } from 'src/infrastructure/in-memory/in-memory-school.repo';
import { InstitutionSignUpDTO } from './DTO/institution-sign-up.dto';

// we use @UseGuards(RolesGuard) on top of the controller so we can use a specific guard
//on top of any method or route we use @Roles() to determine the roles allowd to use this specific routes so both are used for
//difiiernete purposes

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly gradesRepo: SqliteGradesRepo,
    private readonly verificationService: VerificationService,
    private readonly subjectOfferingsRepo: SqliteSubjectOfferingsRepo,
    private readonly subjectsRepo: InMemorySubjectsRepo,
    private readonly studentsService: StudentsService,
    private readonly schoolsRepo: InMemorySchoolsRepo,
    private readonly plansRepo: SqlitePlansRepo,
  ) {}

  private normalizeEmail(email: string): string {
    return String(email ?? '').trim();
  }

  async signIn(signInDto: SignInDTO): Promise<{ access_token: string }> {
    const normalizedEmail = this.normalizeEmail(signInDto.email);
    const user = await this.usersService.findbyEmail(normalizedEmail); //we store the user in this variable

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
    baseSignUpDto: BaseSignUpDTO, //comment: maybe we can remove the role from the dto and just use the one in the argument
    role: RoleId,
  ): Promise<User> {
    const normalizedEmail = this.normalizeEmail(baseSignUpDto.email);
    const existingUser = await this.usersService.findbyEmail(
      normalizedEmail,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const userId = `user_${randomUUID()}`;
    const saltOrRounds = 10;
    const password = baseSignUpDto.password;
    const user = await this.usersService.create({
      ...baseSignUpDto,
      email: normalizedEmail, // comment: test if we can remove this
      roleId: role,
      passwordHash: await bcrypt.hash(password, saltOrRounds),
      userId,
      fullName: baseSignUpDto.userFullName, // comment: test if we can remove this
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
  } // comment: where is this used? try commenting it out

  async teacherSignUp(
    teacherSignUpDTO: TeacherSignUpDTO,
  ): Promise<{ access_token: string }> {
    const normalizedInstitutionCode =
      teacherSignUpDTO.institutionCode?.trim() || '';
    const normalizedSchoolName = teacherSignUpDTO.school?.trim() || '';

    let linkedSchoolId: string | undefined = '';
    let gradeSchoolName = normalizedSchoolName; // comment : might want to change the variable name

    if (normalizedInstitutionCode) {
      const school = await this.schoolsRepo.findByTeacherJoinCode(
        normalizedInstitutionCode,
      );
      if (!school || school.teacherSelfRegistrationEnabled === false) {
        throw new NotFoundException('Institution code is invalid');
      }

      linkedSchoolId = school.schoolId;
      gradeSchoolName = school.schoolName;
    }
    const user = await this.createBaseUser(
      {
        userFullName: teacherSignUpDTO.userFullName,
        email: teacherSignUpDTO.email,
        phoneNumber: teacherSignUpDTO.phoneNumber,
        password: teacherSignUpDTO.password,
      },
      RoleId.TEACHER,
    );
    if (linkedSchoolId) {
      await this.usersService.update(user.userId, {
        schoolId: linkedSchoolId,
      });
    }
    await this.verificationService.sendEmail(user.userId, user.email);

    await this.gradesRepo.create({
      gradeId: teacherSignUpDTO.grade,
      gradeName: teacherSignUpDTO.grade,
      gradeSection: teacherSignUpDTO.section?.trim() || null,
      schoolName: gradeSchoolName,
      teacherId: user.userId,
    });

    const subjects = await this.subjectsRepo.findAll();
    const requiredSubjects = subjects.filter(
      (subject) =>
        subject.subjectName === 'Arabic' ||
        subject.subjectName === 'Mathematics',
    );

    for (const subject of requiredSubjects) {
      await this.subjectOfferingsRepo.create({
        subjectOfferingId: `subject_offering_${randomUUID()}`,
        subjectId: subject.subjectId,
        gradeId: teacherSignUpDTO.grade,
        teacherId: user.userId,
        schoolId: linkedSchoolId || '',
        schoolYear: this.getCurrentSchoolYear(),
      });
    }

    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async institutionSignUp(institutionSignUpDto: InstitutionSignUpDTO): Promise<{
    access_token: string;
    schoolId: string;
    schoolName: string;
    teacherJoinCode: string;
  }> {
    const user = await this.createBaseUser(
      {
        userFullName: institutionSignUpDto.userFullName,
        email: institutionSignUpDto.email,
        phoneNumber: institutionSignUpDto.phoneNumber,
        password: institutionSignUpDto.password,
      },
      RoleId.INSTITUTION,
    );
    await this.verificationService.sendEmail(user.userId, user.email);

    const school = await this.schoolsRepo.create({
      schoolId: `school_${randomUUID()}`,
      schoolName: institutionSignUpDto.schoolName.trim(),
      adminUserId: user.userId,
      teacherJoinCode: this.generateTeacherJoinCode(),
      teacherSelfRegistrationEnabled: true,
    });
    await this.usersService.update(user.userId, {
      schoolId: school.schoolId,
    });

    const payload = {
      sub: user.userId,
      username: user.fullName,
      roleId: user.roleId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      teacherJoinCode: school.teacherJoinCode ?? '',
    };
  }

  async parentSignUp(
    //students should be created first
    parentSignUpDto: ParentSignUpDTO,
  ): Promise<{ access_token: any }> {
    const child = await this.studentsService.findByParentLinkCode(
      parentSignUpDto.parentStudentCode,
    );
    if (!child) {
      throw new NotFoundException('Parent student code is invalid');
    }
    if (child.parentId) {
      throw new ConflictException('This student is already linked to a parent');
    }

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
    await this.studentsService.updateStudent(child.studentId, {
      parentId: user.userId,
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

  async getProfile(userId: UserId) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const grade = await this.gradesRepo.findByTeacherId(userId);
    const [subjects, plans] = await Promise.all([
      this.subjectsRepo.findAll(),
      this.plansRepo.findAll(),
    ]);
    const teacherPlans = plans.filter(
      (plan) => String(plan.teacherId) === String(userId),
    );
    const plannedSubjectNames = Array.from(
      new Set(
        teacherPlans
          .map((plan) =>
            subjects.find(
              (item) => String(item.subjectId) === String(plan.subjectId),
            )?.subjectName,
          )
          .filter((name): name is string => Boolean(name)),
      ),
    );
    const students =
      user.roleId === RoleId.TEACHER
        ? await this.studentsService.getStudents(userId)
        : [];
    const ownedSchool =
      user.roleId === RoleId.INSTITUTION
        ? await this.schoolsRepo.findByAdminUserId(userId)
        : null;

    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      roleId: user.roleId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      grade: grade?.gradeName ?? null,
      section: grade?.gradeSection ?? null,
      school: grade?.schoolName ?? ownedSchool?.schoolName ?? null,
      subject: plannedSubjectNames.length ? plannedSubjectNames.join(', ') : null,
      studentCount: students.length,
      teacherJoinCode: ownedSchool?.teacherJoinCode ?? null,
      teacherSelfRegistrationEnabled:
        ownedSchool?.teacherSelfRegistrationEnabled ?? null,
    };
  }

  async updateProfile(userId: UserId, dto: UpdateProfileDTO) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (dto.email && String(dto.email).trim() !== String(user.email).trim()) {
      const existingUser = await this.usersService.findbyEmail(
        dto.email.trim(),
      );
      if (existingUser && String(existingUser.userId) !== String(userId)) {
        throw new ConflictException('Email already exists');
      }
    }

    const updated = await this.usersService.update(userId, {
      fullName: dto.fullName?.trim() || user.fullName,
      email: dto.email?.trim() || user.email,
      phoneNumber: dto.phoneNumber?.trim() || undefined,
    });

    if (!updated) {
      throw new NotFoundException('User Not Found');
    }

    return this.getProfile(userId);
  }

  async changePassword(userId: UserId, dto: ChangePasswordDTO) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.update(userId, {
      passwordHash: await bcrypt.hash(dto.newPassword, 10),
    });

    return { message: 'Password updated successfully.' };
  }

  async sendEmailVerification(userId: UserId): Promise<any> { //comment: am i even using this?
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    if (user.isVerified) {
      return { message: 'Your account is already verified.' };
    }
    const email = user.email;

    const message = await this.verificationService.sendEmail(user.userId, email);
    return { message };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDTO,
  ): Promise<{ message: string }> {
    const normalizedEmail = this.normalizeEmail(forgotPasswordDto.email);
    const user = await this.usersService.findbyEmail(normalizedEmail);

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

  private generateTeacherJoinCode(): string {
    return `SCH-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private getCurrentSchoolYear(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    return `${year}-${year + 1}`;
  }
}
