import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SqliteAssignmentsRepo } from 'src/database/sqlite-assignment.repo';
import { SqliteQuizResultsRepo } from 'src/database/sqlite-quiz-result.repo';
import { SqliteQuizzesRepo } from 'src/database/sqlite-quiz.repo';
import { Quiz, QuizQuestionType } from 'src/domain/quiz';
import { SubmissionStatus } from 'src/domain/quiz-result';
import type { UserId } from 'src/domain/ids';
import { InMemoryCurriculumItemsRepo } from 'src/infrastructure/in-memory/in-memory-curriculum-item.repo';
import { InMemorySupportProgramsRepo } from 'src/infrastructure/in-memory/in-memory-support-program.repo';
import { StudentsService } from 'src/students/students.service';
import { CreateQuizDTO } from './DTO/create-quiz.dto';

export type QuizLibraryTemplate = {
  templateId: string;
  title: string;
  subjectId: string;
  skillId: string;
  skillName: string;
  supportedSkills?: string[];
  difficulty?: number;
  supportProgramId?: string;
  milestoneId?: string;
  description: string;
  questionCount: number;
  exercises?: {
    curriculumItemId: string;
    title: string;
    supportedSkills: string[];
    difficulty: number;
    estimatedTime: string | number;
  }[];
  questions: {
    prompt: string;
    type: QuizQuestionType;
    options?: { text: string; isCorrect: boolean }[];
  }[];
};

export type TeacherQuizSummary = {
  quizId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  skillFocus: string | null;
  questionCount: number;
  createdAt: Date;
};

@Injectable()
export class QuizzesService {
  constructor(
    private readonly quizzesRepo: SqliteQuizzesRepo,
    private readonly quizResultsRepo: SqliteQuizResultsRepo,
    private readonly assignmentsRepo: SqliteAssignmentsRepo,
    private readonly studentsService: StudentsService,
    private readonly supportProgramsRepo: InMemorySupportProgramsRepo,
    private readonly curriculumItemsRepo: InMemoryCurriculumItemsRepo,
  ) {}

  async createQuiz(
    teacherId: UserId,
    dto: CreateQuizDTO,
    attachmentsByField: Map<string, string[]> = new Map(),
  ): Promise<Quiz> {
    this.validateQuiz(dto);

    return this.quizzesRepo.create({
      quizId: `quiz_${randomUUID()}`,
      teacherId,
      subjectId: dto.subjectId,
      skillFocus: dto.skillFocus?.trim() || undefined,
      title: dto.title,
      questions: dto.questions.map((question) => {
        const attachmentKey = String(
          question.attachmentFieldKey ?? '',
        ).trim();

        return {
          quizQuestionId: `quiz_question_${randomUUID()}`,
          prompt: question.prompt,
          type: question.type,
          attachments:
            question.type === QuizQuestionType.ESSAY
              ? [
                  ...(question.attachments ?? []),
                  ...(attachmentKey
                    ? attachmentsByField.get(attachmentKey) ?? []
                    : []),
                ]
              : [],
          options:
            question.type === QuizQuestionType.MULTIPLE_CHOICE
              ? (question.options ?? []).map((option) => ({
                  quizOptionId: `quiz_option_${randomUUID()}`,
                  text: option.text,
                  isCorrect: Boolean(option.isCorrect),
                }))
              : [],
        };
      }),
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

  async getTeacherQuizzes(teacherId: UserId): Promise<TeacherQuizSummary[]> {
    const quizzes = await this.quizzesRepo.findByTeacherId(teacherId);

    return quizzes
      .map((quiz) => ({
        quizId: String(quiz.quizId),
        title: quiz.title,
        subjectId: String(quiz.subjectId ?? ''),
        subjectName: quiz.subjectId
          ? this.getSubjectLabel(String(quiz.subjectId))
          : 'Unknown Subject',
        skillFocus: quiz.skillFocus?.trim() || null,
        questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
        createdAt: quiz.createdAt,
      }))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  }

  async getQuizLibraryTemplates(
    subjectId?: string,
    skillId?: string,
  ): Promise<QuizLibraryTemplate[]> {
    const curriculumTemplates = await this.getCurriculumLibraryTemplates(
      subjectId,
      skillId,
    );
    const supportPrograms = await this.supportProgramsRepo.findAll();
    const normalizedSkillFilter = skillId?.trim().toLowerCase();

    const supportProgramTemplates = supportPrograms
      .filter((program) => !subjectId || String(program.subjectId) === String(subjectId))
      .filter(
        (program) =>
          !normalizedSkillFilter ||
          String(program.targetSkill).toLowerCase() === normalizedSkillFilter ||
          this.getSkillLabel(program.targetSkill).toLowerCase() ===
            normalizedSkillFilter,
      )
      .flatMap((program) =>
        program.milestones.map((milestone) => ({
          templateId: `${program.supportProgramId}:${milestone.milestoneId}`,
          title: `${this.getSkillLabel(program.targetSkill)} - ${milestone.name}`,
          subjectId: String(program.subjectId),
          skillId: String(program.targetSkill),
          skillName: this.getSkillLabel(program.targetSkill),
          supportedSkills: [this.getSkillLabel(program.targetSkill)],
          difficulty: 2,
          supportProgramId: program.supportProgramId,
          milestoneId: milestone.milestoneId,
          description: milestone.goal,
          questionCount: milestone.items.length,
          exercises: milestone.items.map((item, index) => ({
            curriculumItemId: `${program.supportProgramId}:${milestone.milestoneId}:${index + 1}`,
            title: item.name,
            supportedSkills: [this.getSkillLabel(program.targetSkill)],
            difficulty: 2,
            estimatedTime: 'TBD',
          })),
          questions: milestone.items.map((item) => ({
            prompt: item.name,
            type: QuizQuestionType.ESSAY,
            options: [],
          })),
        })),
      )
      .sort((left, right) => {
        if (left.skillName !== right.skillName) {
          return left.skillName.localeCompare(right.skillName);
        }

        return left.title.localeCompare(right.title);
      });

    return [...curriculumTemplates, ...supportProgramTemplates].sort(
      (left, right) => {
        if (left.subjectId !== right.subjectId) {
          return Number(left.subjectId) - Number(right.subjectId);
        }

        if (left.skillName !== right.skillName) {
          return left.skillName.localeCompare(right.skillName);
        }

        return left.title.localeCompare(right.title);
      },
    );
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
          const student = await this.studentsService.findByIdOrNull(
            result.studentId,
          );
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
          const student = await this.studentsService.findByIdOrNull(
            result.studentId,
          );
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

    const student = await this.studentsService.getById(quizResult.studentId);
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
          questionAttachments: question.attachments ?? [],
          selectedOptionText: selectedOption?.text,
          correctOptionText: correctOption?.text,
          essayAnswer: answer?.essayAnswer,
          essayAttachments: answer?.essayAttachments ?? [],
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

      if (
        question.type === QuizQuestionType.ESSAY &&
        question.prompt.trim().length > 1000
      ) {
        throw new BadRequestException(
          `Question ${index + 1} exceeds the prompt limit.`,
        );
      }
    });
  }

  private getSkillLabel(skillId: string): string {
    const labels: Record<string, string> = {
      skill_counting: 'Counting Skills',
      skill_number_manipulation: 'Number Manipulation',
      skill_problem_solving: 'Problem Solving',
      skill_vocal: 'Vocal Awareness',
      skill_sounds_of_letters: 'Sounds Of Letters',
      skill_writing: 'Writing',
    };

    return labels[skillId] ?? skillId;
  }

  private getSubjectLabel(subjectId: string): string {
    const labels: Record<string, string> = {
      '1': 'Mathematics',
      '2': 'Arabic',
    };

    return labels[String(subjectId)] ?? `Subject ${subjectId}`;
  }

  private async getCurriculumLibraryTemplates(
    subjectId?: string,
    skillId?: string,
  ): Promise<QuizLibraryTemplate[]> {
    const normalizedSkillFilter = skillId?.trim().toLowerCase();
    const curriculumItems = await this.curriculumItemsRepo.findAll();

    const filteredItems = curriculumItems.filter((item) => {
      const subjectMatch = !subjectId || String(item.subjectId) === String(subjectId);
      const skillMatch =
        !normalizedSkillFilter ||
        (item.skillsSupported ?? []).some(
          (supportedSkill) =>
            String(supportedSkill).toLowerCase() === normalizedSkillFilter ||
            this.getSkillLabel(String(supportedSkill)).toLowerCase() ===
              normalizedSkillFilter,
        );

      return subjectMatch && skillMatch;
    });

    const lessonGroups = new Map<string, typeof filteredItems>();

    filteredItems.forEach((item) => {
      const key = `${item.subjectId}:${item.unitNo}:${item.lessonNo}`;
      const group = lessonGroups.get(key) ?? [];
      group.push(item);
      lessonGroups.set(key, group);
    });

    return Array.from(lessonGroups.values())
      .map((group) => {
        const sortedGroup = [...group].sort(
          (left, right) => Number(left.orderInLesson ?? 0) - Number(right.orderInLesson ?? 0),
        );
        const firstItem = sortedGroup[0];
        const dominantSkillId =
          sortedGroup.flatMap((item) => item.skillsSupported ?? [])[0] ?? 'general_skill';
        const supportedSkills = Array.from(
          new Set(
            sortedGroup.flatMap((item) => item.skillsSupported ?? []).map((skill) =>
              this.getSkillLabel(String(skill)),
            ),
          ),
        );
        const averageDifficulty = Math.round(
          sortedGroup.reduce(
            (sum, item) => sum + Number(item.difficulity ?? 0),
            0,
          ) / Math.max(sortedGroup.length, 1),
        );
        const questions = sortedGroup.slice(0, 5).map((item) => ({
          prompt: item.name,
          type: QuizQuestionType.ESSAY,
          options: [],
        }));

        return {
          templateId: `curriculum:${firstItem.subjectId}:${firstItem.unitNo}:${firstItem.lessonNo}`,
          title: `${this.getSubjectLabel(String(firstItem.subjectId))} - Unit ${firstItem.unitNo} Lesson ${firstItem.lessonNo}`,
          subjectId: String(firstItem.subjectId),
          skillId: String(dominantSkillId),
          skillName: this.getSkillLabel(String(dominantSkillId)),
          supportedSkills,
          difficulty: averageDifficulty,
          description: `Curriculum-based practice built from Unit ${firstItem.unitNo}, Lesson ${firstItem.lessonNo}.`,
          questionCount: questions.length,
          exercises: sortedGroup.map((item) => ({
            curriculumItemId: String(item.curriculumItemId),
            title: item.name,
            supportedSkills: (item.skillsSupported ?? []).map((skill) =>
              this.getSkillLabel(String(skill)),
            ),
            difficulty: Number(item.difficulity ?? 0),
            estimatedTime: item.estimatedTime ?? 'TBD',
          })),
          questions,
        };
      })
      .filter((template) => template.questionCount > 0);
  }
}
