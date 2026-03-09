import { GradeId, SchoolId, SubjectId, UserId } from './ids';

export class SubjectOffering {
  subjectOfferingId: string;
  subjectId: SubjectId;
  gradeId: GradeId;
  teacherId: UserId;
  schoolId: SchoolId;
  schoolYear: string;
}
