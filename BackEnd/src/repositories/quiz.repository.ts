import { Quiz } from 'src/domain/quiz';

export interface QuizRepository {
  create(quiz: Quiz): Promise<Quiz>;
  findById(id: string): Promise<Quiz | null>;
  findByMilestoneId(milestoneId: string): Promise<Quiz[]>;
  findAll(): Promise<Quiz[]>;
}
