import { GradeId, UserId, StudentId } from './ids';

export enum ParentRelation {
  FATHER = 'Father',
  MOTHER = 'Mother',
  GUARDIAN = 'Guardian',
}

export class Student {
  studentId: StudentId;
  fullEnglishName: string;
  fullArabicName: string;
  nationalId: string;
  parentId?: UserId;
  parentLinkCode: string;
  gradeId: GradeId;
  schoolName?: string;
  parentRelation?: ParentRelation;
  isActive: boolean;
}
