import { ExerciseId, GradeId, SubjectId } from './ids';

export class Exercise {
  exerciseId: ExerciseId;
  gradeId: GradeId;
  subjectId: SubjectId;
  title: string;
  difficulity: number;
}
