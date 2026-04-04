import { IsEnum, IsString } from 'class-validator';
import { ParentRelation } from 'src/domain/student';
import { BaseSignUpDTO } from './base-sign-up.dto';

export class ParentSignUpDTO extends BaseSignUpDTO {
  @IsEnum(ParentRelation)
  parentType: ParentRelation;

  @IsString()
  studentNationalId: string;
}
