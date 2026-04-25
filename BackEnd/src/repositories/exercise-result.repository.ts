import { ExerciseResult } from 'src/domain/exercise-result';

export interface ExerciseResultRepository {
  create(exerciseResult: ExerciseResult): Promise<ExerciseResult>;
  findById(exerciseResultId: string): Promise<ExerciseResult | null>;
  update(
    exerciseResultId: string,
    patch: Partial<ExerciseResult>,
  ): Promise<ExerciseResult | null>;
  findByStudentId(studentId: string): Promise<ExerciseResult[]>;
  findByMilestoneId(milestoneId: string): Promise<ExerciseResult[]>;
  findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<ExerciseResult[]>;
  findAll(): Promise<ExerciseResult[]>;
}
