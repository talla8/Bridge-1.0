import { QuizResult } from 'src/domain/quiz-result';

export interface QuizResultRepository {
  create(quizResult: QuizResult): Promise<QuizResult>;
  findByStudentId(studentId: string): Promise<QuizResult[]>;
  findByMilestoneId(milestoneId: string): Promise<QuizResult[]>;
  findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<QuizResult[]>;
  findAll(): Promise<QuizResult[]>;
}
