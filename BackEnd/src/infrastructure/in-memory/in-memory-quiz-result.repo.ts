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

  async findAll(): Promise<QuizResult[]> {
    return this.quizResults;
  }
}
