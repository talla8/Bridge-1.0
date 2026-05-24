import { IsString, MinLength } from 'class-validator';
import { BaseSignUpDTO } from './base-sign-up.dto';

export class InstitutionSignUpDTO extends BaseSignUpDTO {
  @IsString()
  @MinLength(2)
  schoolName: string;
}
