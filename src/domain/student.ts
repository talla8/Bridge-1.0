import { GradeId, SchoolId, UserId, StudentId } from './ids';

export class Exercise {
  studentId: StudentId;
  fullName: string;
  parentId: UserId;
  gradeId: GradeId;
  schoolId: SchoolId;
  parentRelation: string; //union 
  isActive: boolean;
}
