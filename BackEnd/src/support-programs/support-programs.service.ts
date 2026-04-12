import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StudentId } from 'src/domain/ids';
import { Quiz } from 'src/domain/quiz';
import { QuizResult } from 'src/domain/quiz-result';
import {
  SupportProgram,
  SupportProgramMilestone,
} from 'src/domain/support-program';
import { InMemoryQuizzesRepo } from 'src/infrastructure/in-memory/in-memory-quiz.repo';
import { InMemoryQuizResultsRepo } from 'src/infrastructure/in-memory/in-memory-quiz-result.repo';
import { InMemorySupportProgramsRepo } from 'src/infrastructure/in-memory/in-memory-support-program.repo';
import { MilestoneProgressSummary } from './types/milestone-progress-summary';

const DEFAULT_REQUIRED_QUIZ_COUNT = 10;
const DEFAULT_REQUIRED_AVERAGE_SCORE = 80;

type StudentSupportProgramState = {
  studentId: StudentId;
  supportProgramId: string;
  currentMilestoneId: string | null;
  completedMilestoneIds: string[];
  isProgramCompleted: boolean;
};

type CreateQuizInput = {
  title: string;
  questions: {
    prompt: string;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
};

type QuizSubmissionAnswerInput = {
  questionId: string;
  selectedOptionId: string;
};

export type StudentSupportProgramProgress = {
  studentId: StudentId;
  supportProgramId: string;
  programName: string;
  currentMilestoneId: string | null;
  isProgramCompleted: boolean;
  milestones: (MilestoneProgressSummary & {
    milestoneNo: number;
    milestoneName: string;
    isCurrent: boolean;
  })[];
};

@Injectable()
export class SupportProgramsService {
  private readonly studentProgramStates = new Map<
    string,
    StudentSupportProgramState
  >();

  constructor(
    private readonly supportProgramsRepo: InMemorySupportProgramsRepo,
    private readonly quizzesRepo: InMemoryQuizzesRepo,
    private readonly quizResultsRepo: InMemoryQuizResultsRepo,
  ) {}

  async createMilestoneQuiz(
    supportProgramId: string,
    milestoneId: string,
    input: CreateQuizInput,
  ): Promise<Quiz> {
    await this.findMilestoneOrThrow(supportProgramId, milestoneId);
    this.validateQuizInput(input);

    return this.quizzesRepo.create({
      quizId: `quiz_${randomUUID()}`,
      supportProgramId,
      milestoneId,
      title: input.title,
      questions: input.questions.map((question) => ({
        quizQuestionId: `quiz_question_${randomUUID()}`,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          quizOptionId: `quiz_option_${randomUUID()}`,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      })),
      createdAt: new Date(),
    });
  }

  async submitQuiz(
    quizId: string,
    studentId: StudentId,
    answers: QuizSubmissionAnswerInput[],
  ): Promise<{
    quizResult: QuizResult;
    milestoneProgress: MilestoneProgressSummary;
    studentProgramState: StudentSupportProgramState;
  }> {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }

    const quiz = await this.quizzesRepo.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    const score = this.gradeQuiz(quiz, answers);
    const quizResult = await this.quizResultsRepo.create({
      quizResultId: `quiz_result_${randomUUID()}`,
      supportProgramId: quiz.supportProgramId,
      milestoneId: quiz.milestoneId,
      studentId,
      quizId: quiz.quizId,
      score,
      submittedAt: new Date(),
    });

    return {
      quizResult,
      ...(await this.updateMilestoneStateAfterProgress(
        studentId,
        quiz.milestoneId,
      )),
    };
  }

  async recordMilestoneQuizResult(
    supportProgramId: string,
    milestoneId: string,
    studentId: StudentId,
    quizId: string,
    score: number,
  ): Promise<{
    quizResult: QuizResult;
    milestoneProgress: MilestoneProgressSummary;
    studentProgramState: StudentSupportProgramState;
  }> {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }
    if (!quizId) {
      throw new BadRequestException('quizId is required.');
    }

    this.validateScore(score);
    await this.findMilestoneOrThrow(supportProgramId, milestoneId);

    const quizResult = await this.quizResultsRepo.create({
      quizResultId: `quiz_result_${randomUUID()}`,
      supportProgramId,
      milestoneId,
      studentId,
      quizId,
      score,
      submittedAt: new Date(),
    });

    return {
      quizResult,
      ...(await this.updateMilestoneStateAfterProgress(studentId, milestoneId)),
    };
  }

  async calculateMilestoneProgress(
    studentId: StudentId,
    milestoneId: string,
  ): Promise<MilestoneProgressSummary> {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }

    const { supportProgram, milestone } =
      await this.findMilestoneWithProgramOrThrow(milestoneId);

    return this.buildMilestoneProgressSummary(
      studentId,
      supportProgram,
      milestone,
    );
  }

  async getMilestoneQuizProgress(
    supportProgramId: string,
    milestoneId: string,
    studentId: StudentId,
  ): Promise<MilestoneProgressSummary> {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }

    const { supportProgram, milestone } = await this.findMilestoneOrThrow(
      supportProgramId,
      milestoneId,
    );

    return this.buildMilestoneProgressSummary(
      studentId,
      supportProgram,
      milestone,
    );
  }

  async getStudentProgress(
    studentId: StudentId,
  ): Promise<StudentSupportProgramProgress[]> {
    if (!studentId) {
      throw new BadRequestException('studentId is required.');
    }

    const supportPrograms = await this.supportProgramsRepo.findAll();

    return Promise.all(
      supportPrograms.map(async (supportProgram) => {
        const state = this.getStudentProgramState(studentId, supportProgram);
        const milestones = await Promise.all(
          [...supportProgram.milestones]
            .sort((a, b) => a.milestoneNo - b.milestoneNo)
            .map(async (milestone) => ({
              ...(await this.buildMilestoneProgressSummary(
                studentId,
                supportProgram,
                milestone,
              )),
              milestoneNo: milestone.milestoneNo,
              milestoneName: milestone.name,
              isCurrent: state.currentMilestoneId === milestone.milestoneId,
            })),
        );

        return {
          studentId,
          supportProgramId: supportProgram.supportProgramId,
          programName: supportProgram.programName,
          currentMilestoneId: state.currentMilestoneId,
          isProgramCompleted: state.isProgramCompleted,
          milestones,
        };
      }),
    );
  }

  private async buildMilestoneProgressSummary(
    studentId: StudentId,
    supportProgram: SupportProgram,
    milestone: SupportProgramMilestone,
  ): Promise<MilestoneProgressSummary> {
    const quizResults = await this.quizResultsRepo.findByStudentAndMilestone(
      studentId,
      milestone.milestoneId,
    );
    const completedQuizCount = quizResults.length;
    const currentAverageScore =
      completedQuizCount === 0
        ? 0
        : quizResults.reduce((sum, quizResult) => sum + quizResult.score, 0) /
          completedQuizCount;
    const requiredQuizCount =
      milestone.requiredQuizCount ?? DEFAULT_REQUIRED_QUIZ_COUNT;
    const requiredAverageScore =
      milestone.requiredAverageScore ?? DEFAULT_REQUIRED_AVERAGE_SCORE;
    const isCompleted =
      completedQuizCount >= requiredQuizCount &&
      currentAverageScore >= requiredAverageScore;

    return {
      studentId,
      supportProgramId: supportProgram.supportProgramId,
      milestoneId: milestone.milestoneId,
      requiredQuizCount,
      completedQuizCount,
      requiredAverageScore,
      currentAverageScore,
      isCompleted,
      remainingQuizCount: Math.max(requiredQuizCount - completedQuizCount, 0),
    };
  }

  private async findMilestoneOrThrow(
    supportProgramId: string,
    milestoneId: string,
  ): Promise<{
    supportProgram: SupportProgram;
    milestone: SupportProgramMilestone;
  }> {
    const supportProgram =
      await this.findSupportProgramOrThrow(supportProgramId);
    const milestone = supportProgram.milestones.find(
      (item) => item.milestoneId === milestoneId,
    );

    if (!milestone) {
      throw new NotFoundException('Support program milestone not found.');
    }

    return { supportProgram, milestone };
  }

  private async findMilestoneWithProgramOrThrow(milestoneId: string): Promise<{
    supportProgram: SupportProgram;
    milestone: SupportProgramMilestone;
  }> {
    const supportPrograms = await this.supportProgramsRepo.findAll();

    for (const supportProgram of supportPrograms) {
      const milestone = supportProgram.milestones.find(
        (item) => item.milestoneId === milestoneId,
      );

      if (milestone) {
        return { supportProgram, milestone };
      }
    }

    throw new NotFoundException('Support program milestone not found.');
  }

  private async findSupportProgramOrThrow(
    supportProgramId: string,
  ): Promise<SupportProgram> {
    const supportProgram =
      await this.supportProgramsRepo.findById(supportProgramId);
    if (!supportProgram) {
      throw new NotFoundException('Support program not found.');
    }

    return supportProgram;
  }

  private async updateMilestoneStateAfterProgress(
    studentId: StudentId,
    milestoneId: string,
  ): Promise<{
    milestoneProgress: MilestoneProgressSummary;
    studentProgramState: StudentSupportProgramState;
  }> {
    const milestoneProgress = await this.calculateMilestoneProgress(
      studentId,
      milestoneId,
    );
    const { supportProgram } =
      await this.findMilestoneWithProgramOrThrow(milestoneId);
    const state = this.getStudentProgramState(studentId, supportProgram);

    if (!milestoneProgress.isCompleted) {
      return { milestoneProgress, studentProgramState: state };
    }

    if (!state.completedMilestoneIds.includes(milestoneId)) {
      state.completedMilestoneIds.push(milestoneId);
    }

    const nextMilestone = this.findNextMilestone(supportProgram, milestoneId);
    state.currentMilestoneId = nextMilestone?.milestoneId ?? null;
    state.isProgramCompleted = !nextMilestone;

    this.studentProgramStates.set(
      this.getStudentProgramStateKey(
        studentId,
        supportProgram.supportProgramId,
      ),
      state,
    );

    return { milestoneProgress, studentProgramState: state };
  }

  private getStudentProgramState(
    studentId: StudentId,
    supportProgram: SupportProgram,
  ): StudentSupportProgramState {
    const key = this.getStudentProgramStateKey(
      studentId,
      supportProgram.supportProgramId,
    );
    const existingState = this.studentProgramStates.get(key);
    if (existingState) return existingState;

    const firstMilestone = [...supportProgram.milestones].sort(
      (a, b) => a.milestoneNo - b.milestoneNo,
    )[0];

    return {
      studentId,
      supportProgramId: supportProgram.supportProgramId,
      currentMilestoneId: firstMilestone?.milestoneId ?? null,
      completedMilestoneIds: [],
      isProgramCompleted: false,
    };
  }

  private getStudentProgramStateKey(
    studentId: StudentId,
    supportProgramId: string,
  ): string {
    return `${studentId}:${supportProgramId}`;
  }

  private findNextMilestone(
    supportProgram: SupportProgram,
    milestoneId: string,
  ): SupportProgramMilestone | null {
    const orderedMilestones = [...supportProgram.milestones].sort(
      (a, b) => a.milestoneNo - b.milestoneNo,
    );
    const currentIndex = orderedMilestones.findIndex(
      (milestone) => milestone.milestoneId === milestoneId,
    );

    return orderedMilestones[currentIndex + 1] ?? null;
  }

  private validateScore(score: number): void {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new BadRequestException('score must be between 0 and 100.');
    }
  }

  private validateQuizInput(input: CreateQuizInput): void {
    if (!input?.title) {
      throw new BadRequestException('Quiz title is required.');
    }

    if (!input.questions?.length) {
      throw new BadRequestException('Quiz must have at least one question.');
    }

    for (const question of input.questions) {
      if (!question.prompt) {
        throw new BadRequestException('Each question must have a prompt.');
      }

      if (!question.options || question.options.length < 2) {
        throw new BadRequestException(
          'Each question must have at least two options.',
        );
      }

      const correctOptions = question.options.filter(
        (option) => option.isCorrect,
      );
      if (correctOptions.length !== 1) {
        throw new BadRequestException(
          'Each question must have exactly one correct option.',
        );
      }
    }
  }

  private gradeQuiz(
    quiz: Quiz,
    answers: QuizSubmissionAnswerInput[] = [],
  ): number {
    if (quiz.questions.length === 0) return 0;

    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
    );
    const correctAnswers = quiz.questions.filter((question) => {
      const selectedOptionId = answerMap.get(question.quizQuestionId);
      const correctOption = question.options.find((option) => option.isCorrect);

      return correctOption?.quizOptionId === selectedOptionId;
    }).length;

    return Math.round((correctAnswers / quiz.questions.length) * 100);
  }
}
