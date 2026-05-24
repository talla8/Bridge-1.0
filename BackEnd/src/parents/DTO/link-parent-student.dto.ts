import { IsString } from 'class-validator';

export class LinkParentStudentDTO {
  @IsString()
  parentStudentCode: string;
}
