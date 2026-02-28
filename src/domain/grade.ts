import { GradeId, SchoolId, UserId } from './ids';

export class Exercise {
  gradeId: GradeId;
  gradeName: string; //union type would be mre suitable
  gradeSection: string;
  schoolId: SchoolId;
  teacherId: UserId;
}
