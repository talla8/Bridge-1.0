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
    return this.quizzes.find((quiz) => quiz.quizId === id) ?? null;
  }

  async findByMilestoneId(milestoneId: string): Promise<Quiz[]> {
    return this.quizzes.filter((quiz) => quiz.milestoneId === milestoneId);
  }

  async findByTeacherId(teacherId: string): Promise<Quiz[]> {
    return this.quizzes.filter((quiz) => quiz.teacherId === teacherId);
  }

  async findAll(): Promise<Quiz[]> {
    return this.quizzes;
  }
}
