import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { RoleId } from 'src/domain/user';

export class BaseSignUpDTO {
  @IsString()
  userFullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(RoleId)
  role?: RoleId;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(/[A-Z]/, { message: '...' })
  @Matches(/[a-z]/, { message: '...' })
  @Matches(/[0-9]/, { message: 'Password must contain numbers' }) //change those
  password: string;
}
