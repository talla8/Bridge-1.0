import { BaseSignUpDTO } from './base-sign-up.dto';
import { GradeName } from 'src/domain/grade';

export class TeacherSignUpDTO {
  baseSignUpDto: BaseSignUpDTO;
  grade: GradeName;
  school?: string;
}
