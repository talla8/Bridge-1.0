import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { GradeName } from 'src/domain/grade';

export class CreateInstitutionTeacherDTO {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain numbers' })
  password: string;

  @IsEnum(GradeName)
  grade: GradeName;

  @IsOptional()
  @IsString()
  section?: string;
}
