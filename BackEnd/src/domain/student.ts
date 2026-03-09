import { GradeId, SchoolId, UserId, StudentId } from './ids';

export enum ParentRelation {
  FATHER = 'Father',
  MOTHER = 'Mother',
  GUARDIAN = 'Guardian',
}

export class Student {
  studentId: StudentId;
  fullName: string;
  parentId: UserId;
  gradeId: GradeId;
  schoolId: SchoolId;
  parentRelation: ParentRelation;
  isActive: boolean;
}
