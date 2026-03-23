import { RoleId } from 'src/domain/user';
import { TeacherSignUpDTO } from './teacher-sign-up.dto';
import { ParentSignUpDTO } from './parent-sign-up.dto';
import {
  IsString,
  IsEmail,
  isString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class BaseSignUpDTO {
  @IsString()
  userFullName: string;

  @IsEmail()
  email: string;
  role: RoleId;
  phoneNumber?: string;
  
  @MinLength(8)
  @MaxLength(16)
  @Matches(/[A-Z]/, { message: '...' })
  @Matches(/[a-z]/, { message: '...' })
  @Matches(/[0-9]/, { message: '...' })
  password: string;

  extrafields?: TeacherSignUpDTO | ParentSignUpDTO;
}
