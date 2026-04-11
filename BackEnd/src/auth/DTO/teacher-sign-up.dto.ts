import { IsEnum, IsString } from 'class-validator';
import { BaseSignUpDTO } from './base-sign-up.dto';
import { GradeName } from 'src/domain/grade';

export class TeacherSignUpDTO extends BaseSignUpDTO {
  @IsEnum(GradeName)
  grade: GradeName;

  @IsString()
  school: string;
}
