import { Injectable } from '@nestjs/common';
import { QuizResult } from 'src/domain/quiz-result';
import { QuizResultRepository } from 'src/repositories/quiz-result.repository';

@Injectable()
export class InMemoryQuizResultsRepo implements QuizResultRepository {
  private quizResults: QuizResult[] = [];

  async create(quizResult: QuizResult): Promise<QuizResult> {
    this.quizResults.push(quizResult);
    return quizResult;
  }

  async findById(quizResultId: string): Promise<QuizResult | null> {
    return (
      this.quizResults.find(
        (quizResult) => quizResult.quizResultId === quizResultId,
      ) ?? null
    );
  }

  async update(
    quizResultId: string,
    patch: Partial<QuizResult>,
  ): Promise<QuizResult | null> {
    const index = this.quizResults.findIndex(
      (quizResult) => quizResult.quizResultId === quizResultId,
    );
    if (index === -1) return null;

    this.quizResults[index] = {
      ...this.quizResults[index],
      ...patch,
    };

    return this.quizResults[index];
  }

  async findByStudentId(studentId: string): Promise<QuizResult[]> {
    return this.quizResults.filter(
      (quizResult) => quizResult.studentId === studentId,
    );
  }

  async findByMilestoneId(milestoneId: string): Promise<QuizResult[]> {
    return this.quizResults.filter(
      (quizResult) => quizResult.milestoneId === milestoneId,
    );
  }

  async findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<QuizResult[]> {
    return this.quizResults.filter(
      (quizResult) =>
        quizResult.studentId === studentId &&
        quizResult.milestoneId === milestoneId,
    );
  }

  async findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizResult[]> {
    return this.quizResults.filter(
      (quizResult) =>
        quizResult.studentId === studentId && quizResult.quizId === quizId,
    );
  }

  async findAll(): Promise<QuizResult[]> {
    return this.quizResults;
  }
}
