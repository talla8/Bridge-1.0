import { GradeId, SchoolId, UserId } from './ids';

export enum GradeName {
  First = 'First Grade',
  Second = 'Second Grade',
  Third = 'Third Grade',
}
export class Grade {
  gradeId: GradeId;
  gradeName: GradeName; //chnge this
  schoolName?: string | null;
  teacherId: UserId;
}
