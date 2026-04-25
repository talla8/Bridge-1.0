import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Quiz, QuizQuestionType } from 'src/domain/quiz';
import { SubmissionStatus } from 'src/domain/quiz-result';
import type { UserId } from 'src/domain/ids';
import { InMemoryAssignmentsRepo } from 'src/infrastructure/in-memory/in-memory-assignment.repo';
import { InMemoryQuizzesRepo } from 'src/infrastructure/in-memory/in-memory-quiz.repo';
import { InMemoryQuizResultsRepo } from 'src/infrastructure/in-memory/in-memory-quiz-result.repo';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { CreateQuizDTO } from './DTO/create-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly quizzesRepo: InMemoryQuizzesRepo,
    private readonly quizResultsRepo: InMemoryQuizResultsRepo,
    private readonly assignmentsRepo: InMemoryAssignmentsRepo,
    private readonly studentsRepo: InMemoryStudentsRepo,
  ) {}

  async createQuiz(teacherId: UserId, dto: CreateQuizDTO): Promise<Quiz> {
    this.validateQuiz(dto);

    return this.quizzesRepo.create({
      quizId: `quiz_${randomUUID()}`,
      teacherId,
      subjectId: dto.subjectId,
      title: dto.title,
      questions: dto.questions.map((question) => ({
        quizQuestionId: `quiz_question_${randomUUID()}`,
        prompt: question.prompt,
        type: question.type,
        options:
          question.type === QuizQuestionType.MULTIPLE_CHOICE
            ? (question.options ?? []).map((option) => ({
                quizOptionId: `quiz_option_${randomUUID()}`,
                text: option.text,
                isCorrect: Boolean(option.isCorrect),
              }))
            : [],
      })),
      createdAt: new Date(),
    });
  }

  async getTeacherQuizById(
    teacherId: UserId,
    quizId: string,
  ): Promise<Quiz> {
    const quiz = await this.quizzesRepo.findById(quizId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    if (String(quiz.teacherId) !== String(teacherId)) {
      throw new ForbiddenException('Teacher does not own this quiz.');
    }

    return quiz;
  }

  async getPendingReviews(teacherId: UserId) {
    const quizzes = await this.quizzesRepo.findByTeacherId(teacherId);
    const quizMap = new Map(quizzes.map((quiz) => [quiz.quizId, quiz]));
    const results = await this.quizResultsRepo.findAll();

    const pendingRows = await Promise.all(
      results
        .filter(
          (result) =>
            result.status === SubmissionStatus.PENDING_REVIEW &&
            quizMap.has(result.quizId),
        )
        .map(async (result) => {
          const quiz = quizMap.get(result.quizId);
          const student = await this.studentsRepo.findById(result.studentId);
          const assignment = result.assignmentId
            ? await this.assignmentsRepo.findById(result.assignmentId)
            : null;
          if (!quiz || !student) {
            return null;
          }

          return {
            quizResultId: result.quizResultId,
            assignmentId: result.assignmentId ?? null,
            quizId: quiz.quizId,
            title: assignment?.title ?? quiz.title,
            studentId: student.studentId,
            studentName: student.fullEnglishName,
            submittedAt: result.submittedAt,
            pendingEssayCount: result.answers.filter(
              (answer) => typeof answer.isCorrect !== 'boolean',
            ).length,
          };
        }),
    );

    return pendingRows
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() -
          new Date(left.submittedAt).getTime(),
      );
  }

  async getReviewedHistory(teacherId: UserId) {
    const quizzes = await this.quizzesRepo.findByTeacherId(teacherId);
    const quizMap = new Map(quizzes.map((quiz) => [quiz.quizId, quiz]));
    const results = await this.quizResultsRepo.findAll();

    const reviewedRows = await Promise.all(
      results
        .filter(
          (result) =>
            (result.status === SubmissionStatus.REVIEWED ||
              result.status === SubmissionStatus.AUTO_GRADED) &&
            quizMap.has(result.quizId),
        )
        .map(async (result) => {
          const quiz = quizMap.get(result.quizId);
          const student = await this.studentsRepo.findById(result.studentId);
          const assignment = result.assignmentId
            ? await this.assignmentsRepo.findById(result.assignmentId)
            : null;
          if (!quiz || !student) {
            return null;
          }

          return {
            quizResultId: result.quizResultId,
            assignmentId: result.assignmentId ?? null,
            quizId: quiz.quizId,
            title: assignment?.title ?? quiz.title,
            studentId: student.studentId,
            studentName: student.fullEnglishName,
            submittedAt: result.submittedAt,
            reviewedAt: result.reviewedAt ?? null,
            score: result.score,
            status: result.status,
            feedback: result.feedback ?? null,
          };
        }),
    );

    return reviewedRows
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((left, right) => {
        const leftTime = left.reviewedAt
          ? new Date(left.reviewedAt).getTime()
          : new Date(left.submittedAt).getTime();
        const rightTime = right.reviewedAt
          ? new Date(right.reviewedAt).getTime()
          : new Date(right.submittedAt).getTime();
        return rightTime - leftTime;
      });
  }

  async getTeacherQuizResultDetail(teacherId: UserId, quizResultId: string) {
    const quizResult = await this.quizResultsRepo.findById(quizResultId);
    if (!quizResult) {
      throw new NotFoundException('Quiz result not found.');
    }

    const quiz = await this.quizzesRepo.findById(quizResult.quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    if (String(quiz.teacherId) !== String(teacherId)) {
      throw new ForbiddenException('Teacher does not own this quiz result.');
    }

    const student = await this.studentsRepo.findById(quizResult.studentId);
    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    const assignment = quizResult.assignmentId
      ? await this.assignmentsRepo.findById(quizResult.assignmentId)
      : null;

    return {
      quizResultId: quizResult.quizResultId,
      assignmentId: quizResult.assignmentId ?? null,
      quizId: quiz.quizId,
      title: assignment?.title ?? quiz.title,
      studentId: student.studentId,
      studentName: student.fullEnglishName,
      submittedAt: quizResult.submittedAt,
      reviewedAt: quizResult.reviewedAt,
      score: quizResult.score,
      status: quizResult.status,
      feedback: quizResult.feedback,
      answers: quiz.questions.map((question) => {
        const answer = quizResult.answers.find(
          (item) => item.questionId === question.quizQuestionId,
        );
        const selectedOption = question.options.find(
          (option) => option.quizOptionId === answer?.selectedOptionId,
        );
        const correctOption = question.options.find((option) => option.isCorrect);

        return {
          questionId: question.quizQuestionId,
          prompt: question.prompt,
          type: question.type,
          selectedOptionText: selectedOption?.text,
          correctOptionText: correctOption?.text,
          essayAnswer: answer?.essayAnswer,
          isCorrect: answer?.isCorrect,
        };
      }),
    };
  }

  async reviewTeacherQuizResult(
    teacherId: UserId,
    quizResultId: string,
    score: number,
    feedback?: string,
  ) {
    const detail = await this.getTeacherQuizResultDetail(teacherId, quizResultId);

    const updated = await this.quizResultsRepo.update(quizResultId, {
      score,
      feedback,
      status: SubmissionStatus.REVIEWED,
      reviewedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException('Quiz result not found.');
    }

    return {
      ...detail,
      score: updated.score,
      feedback: updated.feedback,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
    };
  }

  private validateQuiz(dto: CreateQuizDTO): void {
    if (!dto.subjectId) {
      throw new BadRequestException('subjectId is required.');
    }

    if (!dto.questions.length) {
      throw new BadRequestException('At least one question is required.');
    }

    dto.questions.forEach((question, index) => {
      if (question.type === QuizQuestionType.MULTIPLE_CHOICE) {
        const options = question.options ?? [];
        const correctCount = options.filter((option) => option.isCorrect).length;

        if (options.length < 2) {
          throw new BadRequestException(
            `Question ${index + 1} must have at least two options.`,
          );
        }

        if (correctCount !== 1) {
          throw new BadRequestException(
            `Question ${index + 1} must have exactly one correct answer.`,
          );
        }
      }
    });
  }
}
