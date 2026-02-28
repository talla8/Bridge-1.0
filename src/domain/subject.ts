import { ExerciseId, GradeId, SchoolId, SkillId, StudentId, SubjectId } from './ids';

export class Exercise {
  subjectId: SubjectId;
  subjectName: string; //union
  schoolYear: string;
}
