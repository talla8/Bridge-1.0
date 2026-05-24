import { Injectable } from '@nestjs/common';
import { Quiz } from 'src/domain/quiz';
import { QuizRepository } from 'src/repositories/quiz.repository';

@Injectable()
export class InMemoryQuizzesRepo implements QuizRepository {
  private quizzes: Quiz[] = [];

  async create(quiz: Quiz): Promise<Quiz> {
    this.quizzes.push(quiz);
    return quiz;
  }

  async findById(id: string): Promise<Quiz | null> {
    return (
      this.quizzes.find((quiz) => String(quiz.quizId) === String(id)) ?? null
    );
  }

  async findByMilestoneId(milestoneId: string): Promise<Quiz[]> {
    return this.quizzes.filter(
      (quiz) => String(quiz.milestoneId) === String(milestoneId),
    );
  }

  async findByTeacherId(teacherId: string): Promise<Quiz[]> {
    return this.quizzes.filter(
      (quiz) => String(quiz.teacherId) === String(teacherId),
    );
  }

  async findAll(): Promise<Quiz[]> {
    return this.quizzes;
  }
}
