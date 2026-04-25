import { QuizResult } from 'src/domain/quiz-result';

export interface QuizResultRepository {
  create(quizResult: QuizResult): Promise<QuizResult>;
  findById(quizResultId: string): Promise<QuizResult | null>;
  update(
    quizResultId: string,
    patch: Partial<QuizResult>,
  ): Promise<QuizResult | null>;
  findByStudentId(studentId: string): Promise<QuizResult[]>;
  findByMilestoneId(milestoneId: string): Promise<QuizResult[]>;
  findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<QuizResult[]>;
  findByStudentAndQuiz(studentId: string, quizId: string): Promise<QuizResult[]>;
  findAll(): Promise<QuizResult[]>;
}
