import { ParentRelation } from 'src/domain/student';
import { BaseSignUpDTO } from './base-sign-up.dto';

export class ParentSignUpDTO {
  baseSignUpDto: BaseSignUpDTO;
  parentType: ParentRelation;
  studentNationalId: string;
}
