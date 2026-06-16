import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizOption, QuizQuestion } from 'src/domain/quiz';
import { QuizRepository } from 'src/repositories/quiz.repository';
import { QuizEntity } from './entities/quiz.entity';

@Injectable()
export class SqliteQuizzesRepo implements QuizRepository {
  constructor(
    @InjectRepository(QuizEntity)
    private readonly repository: Repository<QuizEntity>,
  ) {}

  async create(quiz: Quiz): Promise<Quiz> {
    const entity = this.repository.create(this.toEntity(quiz));
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Quiz | null> {
    const entity = await this.repository.findOneBy({ quizId: String(id) });
    return entity ? this.toDomain(entity) : null;
  }

  async findByMilestoneId(milestoneId: string): Promise<Quiz[]> {
    const entities = await this.repository.find({
      where: { milestoneId: String(milestoneId) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByTeacherId(teacherId: string): Promise<Quiz[]> {
    const entities = await this.repository.find({
      where: { teacherId: String(teacherId) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAll(): Promise<Quiz[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toEntity(quiz: Quiz): QuizEntity {
    return {
      quizId: String(quiz.quizId),
      teacherId:
        quiz.teacherId === undefined || quiz.teacherId === null
          ? undefined
          : String(quiz.teacherId),
      subjectId:
        quiz.subjectId === undefined || quiz.subjectId === null
          ? undefined
          : String(quiz.subjectId),
      skillFocus:
        quiz.skillFocus === undefined || quiz.skillFocus === null
          ? undefined
          : String(quiz.skillFocus),
      supportProgramId:
        quiz.supportProgramId === undefined || quiz.supportProgramId === null
          ? undefined
          : String(quiz.supportProgramId),
      milestoneId:
        quiz.milestoneId === undefined || quiz.milestoneId === null
          ? undefined
          : String(quiz.milestoneId),
      title: String(quiz.title),
      questionsJson: JSON.stringify(quiz.questions ?? []),
      createdAt: new Date(quiz.createdAt),
    };
  }

  private toDomain(entity: QuizEntity): Quiz {
    return {
      quizId: String(entity.quizId),
      teacherId:
        entity.teacherId === undefined || entity.teacherId === null
          ? undefined
          : String(entity.teacherId),
      subjectId:
        entity.subjectId === undefined || entity.subjectId === null
          ? undefined
          : String(entity.subjectId),
      skillFocus:
        entity.skillFocus === undefined || entity.skillFocus === null
          ? undefined
          : String(entity.skillFocus),
      supportProgramId:
        entity.supportProgramId === undefined ||
        entity.supportProgramId === null
          ? undefined
          : String(entity.supportProgramId),
      milestoneId:
        entity.milestoneId === undefined || entity.milestoneId === null
          ? undefined
          : String(entity.milestoneId),
      title: entity.title,
      questions: this.parseQuestions(entity.questionsJson),
      createdAt: new Date(entity.createdAt),
    };
  }

  private parseQuestions(questionsJson: string): QuizQuestion[] {
    const parsed = JSON.parse(questionsJson) as QuizQuestion[];
    return Array.isArray(parsed)
      ? parsed.map((question) => ({
          ...question,
          quizQuestionId: String(question.quizQuestionId),
          prompt: String(question.prompt),
          attachments: Array.isArray(question.attachments)
            ? question.attachments.map((attachment) => String(attachment))
            : [],
          options: Array.isArray(question.options)
            ? question.options.map((option) => this.normalizeOption(option))
            : [],
        }))
      : [];
  }

  private normalizeOption(option: QuizOption): QuizOption {
    return {
      quizOptionId: String(option.quizOptionId),
      text: String(option.text),
      isCorrect: Boolean(option.isCorrect),
    };
  }
}
