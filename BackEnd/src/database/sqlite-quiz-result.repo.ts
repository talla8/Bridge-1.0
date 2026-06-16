import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizResult, QuizResultAnswer } from 'src/domain/quiz-result';
import { QuizResultRepository } from 'src/repositories/quiz-result.repository';
import { QuizResultEntity } from './entities/quiz-result.entity';

@Injectable()
export class SqliteQuizResultsRepo implements QuizResultRepository {
  constructor(
    @InjectRepository(QuizResultEntity)
    private readonly repository: Repository<QuizResultEntity>,
  ) {}

  async create(quizResult: QuizResult): Promise<QuizResult> {
    const entity = this.repository.create(this.toEntity(quizResult));
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(quizResultId: string): Promise<QuizResult | null> {
    const entity = await this.repository.findOneBy({
      quizResultId: String(quizResultId),
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(
    quizResultId: string,
    patch: Partial<QuizResult>,
  ): Promise<QuizResult | null> {
    const existing = await this.repository.findOneBy({
      quizResultId: String(quizResultId),
    });
    if (!existing) return null;

    const merged = this.repository.merge(
      existing,
      this.toEntityPatch(patch) as Partial<QuizResultEntity>,
    );
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async findByStudentId(studentId: string): Promise<QuizResult[]> {
    const entities = await this.repository.find({
      where: { studentId: String(studentId) },
      order: { submittedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByMilestoneId(milestoneId: string): Promise<QuizResult[]> {
    const entities = await this.repository.find({
      where: { milestoneId: String(milestoneId) },
      order: { submittedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByStudentAndMilestone(
    studentId: string,
    milestoneId: string,
  ): Promise<QuizResult[]> {
    const entities = await this.repository.find({
      where: {
        studentId: String(studentId),
        milestoneId: String(milestoneId),
      },
      order: { submittedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizResult[]> {
    const entities = await this.repository.find({
      where: {
        studentId: String(studentId),
        quizId: String(quizId),
      },
      order: { submittedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAll(): Promise<QuizResult[]> {
    const entities = await this.repository.find({
      order: { submittedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toEntity(quizResult: QuizResult): QuizResultEntity {
    return {
      quizResultId: String(quizResult.quizResultId),
      assignmentId:
        quizResult.assignmentId === undefined || quizResult.assignmentId === null
          ? undefined
          : String(quizResult.assignmentId),
      studentId: String(quizResult.studentId),
      supportProgramId:
        quizResult.supportProgramId === undefined ||
        quizResult.supportProgramId === null
          ? undefined
          : String(quizResult.supportProgramId),
      milestoneId:
        quizResult.milestoneId === undefined || quizResult.milestoneId === null
          ? undefined
          : String(quizResult.milestoneId),
      quizId: String(quizResult.quizId),
      score: Number(quizResult.score),
      status: quizResult.status,
      answersJson: JSON.stringify(quizResult.answers ?? []),
      feedback:
        quizResult.feedback === undefined || quizResult.feedback === null
          ? undefined
          : String(quizResult.feedback),
      submittedAt: new Date(quizResult.submittedAt),
      reviewedAt:
        quizResult.reviewedAt === undefined || quizResult.reviewedAt === null
          ? undefined
          : new Date(quizResult.reviewedAt),
    };
  }

  private toEntityPatch(
    patch: Partial<QuizResult>,
  ): Partial<QuizResultEntity> {
    return {
      ...patch,
      assignmentId:
        patch.assignmentId === undefined || patch.assignmentId === null
          ? patch.assignmentId
          : String(patch.assignmentId),
      studentId:
        patch.studentId === undefined || patch.studentId === null
          ? patch.studentId
          : String(patch.studentId),
      supportProgramId:
        patch.supportProgramId === undefined || patch.supportProgramId === null
          ? patch.supportProgramId
          : String(patch.supportProgramId),
      milestoneId:
        patch.milestoneId === undefined || patch.milestoneId === null
          ? patch.milestoneId
          : String(patch.milestoneId),
      quizId:
        patch.quizId === undefined || patch.quizId === null
          ? patch.quizId
          : String(patch.quizId),
      score:
        patch.score === undefined || patch.score === null
          ? patch.score
          : Number(patch.score),
      answersJson:
        patch.answers === undefined ? undefined : JSON.stringify(patch.answers),
      feedback:
        patch.feedback === undefined || patch.feedback === null
          ? patch.feedback
          : String(patch.feedback),
      submittedAt:
        patch.submittedAt === undefined || patch.submittedAt === null
          ? patch.submittedAt
          : new Date(patch.submittedAt),
      reviewedAt:
        patch.reviewedAt === undefined || patch.reviewedAt === null
          ? patch.reviewedAt
          : new Date(patch.reviewedAt),
    };
  }

  private toDomain(entity: QuizResultEntity): QuizResult {
    return {
      quizResultId: String(entity.quizResultId),
      assignmentId:
        entity.assignmentId === undefined || entity.assignmentId === null
          ? undefined
          : String(entity.assignmentId),
      studentId: String(entity.studentId),
      supportProgramId:
        entity.supportProgramId === undefined ||
        entity.supportProgramId === null
          ? undefined
          : String(entity.supportProgramId),
      milestoneId:
        entity.milestoneId === undefined || entity.milestoneId === null
          ? undefined
          : String(entity.milestoneId),
      quizId: String(entity.quizId),
      score: Number(entity.score),
      status: entity.status,
      answers: this.parseAnswers(entity.answersJson),
      feedback:
        entity.feedback === undefined || entity.feedback === null
          ? undefined
          : String(entity.feedback),
      submittedAt: new Date(entity.submittedAt),
      reviewedAt:
        entity.reviewedAt === undefined || entity.reviewedAt === null
          ? undefined
          : new Date(entity.reviewedAt),
    };
  }

  private parseAnswers(answersJson: string): QuizResultAnswer[] {
    const parsed = JSON.parse(answersJson) as QuizResultAnswer[];
    return Array.isArray(parsed)
      ? parsed.map((answer) => ({
          questionId: String(answer.questionId),
          selectedOptionId:
            answer.selectedOptionId === undefined ||
            answer.selectedOptionId === null
              ? undefined
              : String(answer.selectedOptionId),
          essayAnswer:
            answer.essayAnswer === undefined || answer.essayAnswer === null
              ? undefined
              : String(answer.essayAnswer),
          essayAttachments: Array.isArray(answer.essayAttachments)
            ? answer.essayAttachments.map((item) => String(item))
            : [],
          isCorrect:
            typeof answer.isCorrect === 'boolean' ? answer.isCorrect : undefined,
        }))
      : [];
  }
}
