import { Injectable } from '@nestjs/common';
import { ExerciseResult } from 'src/domain/exercise-result';
import { ExerciseResultRepository } from 'src/repositories/exercise-result.repository';

@Injectable()
export class InMemoryExerciseResultsRepo implements ExerciseResultRepository {
  private exerciseResults: ExerciseResult[] = [];

  async create(exerciseResult: ExerciseResult): Promise<ExerciseResult> {
    this.exerciseResults.push(exerciseResult);
    return exerciseResult;
  }

  async findById(exerciseResultId: string): Promise<ExerciseResult | null> {
    return (
      this.exerciseResults.find(
        (exerciseResult) =>
          exerciseResult.exerciseResultId === exerciseResultId,
      ) ?? null
    );
  }

  async update(
    exerciseResultId: string,
    patch: Partial<ExerciseResult>,
  ): Promise<ExerciseResult | null> {
    const index = this.exerciseResults.findIndex(
      (exerciseResult) => exerciseResult.exerciseResultId === exerciseResultId,
    );
    if (index === -1) return null;

    this.exerciseResults[index] = {
      ...this.exerciseResults[index],
      ...patch,
    };

    return this.exerciseResults[index];
  }

  async findByStudentId(studentId: string): Promise<ExerciseResult[]> {
    return this.exerciseResults.filter(
      (exerciseResult) => exerciseResult.studentId === studentId,
    );
  }

  async findByMilestoneId(milestoneId: string): Promise<ExerciseResult[]> {
    return this.exerciseResults.filter(
      (exerciseResult) => exerciseResult.milestoneId === milestoneId,
    );
  }

  async findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<ExerciseResult[]> {
    return this.exerciseResults.filter(
      (exerciseResult) =>
        exerciseResult.studentId === studentId &&
        exerciseResult.milestoneId === milestoneId,
    );
  }

  async findAll(): Promise<ExerciseResult[]> {
    return this.exerciseResults;
  }
}
