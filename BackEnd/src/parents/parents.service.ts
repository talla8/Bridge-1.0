import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  AssignmentSourceType,
  AssignmentType,
} from 'src/domain/assignment';
import { PlanItemStatus } from 'src/domain/plan-item';
import { GradeId, StudentId, UserId } from 'src/domain/ids';
import { Plan } from 'src/domain/plan';
import {
  ESSAY_ANSWER_MAX_CHARACTERS,
  QuizQuestionType,
} from 'src/domain/quiz';
import { QuizResultAnswer, SubmissionStatus } from 'src/domain/quiz-result';
import { Session } from 'src/domain/session';
import { Student } from 'src/domain/student';
import { InMemoryAssignmentsRepo } from 'src/infrastructure/in-memory/in-memory-assignment.repo';
import { InMemoryAttendancesRepo } from 'src/infrastructure/in-memory/in-memory-attendance.repo';
import { SqliteAssignmentsRepo } from 'src/database/sqlite-assignment.repo';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { SqlitePlansRepo } from 'src/database/sqlite-plan.repo';
import { SqliteQuizResultsRepo } from 'src/database/sqlite-quiz-result.repo';
import { SqliteQuizzesRepo } from 'src/database/sqlite-quiz.repo';
import { InMemorySkillsRepo } from 'src/infrastructure/in-memory/in-memory-skill.repo';
import { SupportProgramsService } from 'src/support-programs/support-programs.service';
import { UsersService } from 'src/users/users.service';
import { BaselineProcessingServiceService } from 'src/baseline/baseline-processing-service.service';
import { StudentsService } from 'src/students/students.service';
import { randomUUID } from 'crypto';
import { SubmitParentQuizDTO } from './DTO/submit-parent-quiz.dto';
import { LinkParentStudentDTO } from './DTO/link-parent-student.dto';

export type ParentProfileSummary = {
  parentId: UserId;
  fullName: string;
  email: string;
  students: {
    studentId: StudentId;
    fullEnglishName: string;
    fullArabicName: string;
    gradeId: GradeId;
    parentLinkCode: string;
    isActive: boolean;
  }[];
};

export type ParentStudentDashboard = {
  studentId: StudentId;
  studentName: string;
  studentArabicName: string;
  grade: string;
  section: string | null;
  attendanceAverage: number;
  overallProgress: number;
  isInSupportPlan: boolean;
  supportPlanLabel: string;
  todayLearning: {
    title: string;
    description: string;
    tag: string;
  } | null;
  nextLesson: {
    title: string;
    description: string;
    tag: string;
  } | null;
  overdueQuizzes: {
    assignmentId: string;
    title: string;
    dueLabel: string;
  }[];
  assignedQuizzes: {
    assignmentId: string;
    title: string;
    dueLabel: string | null;
    status: AssignmentStatus;
  }[];
  skillProgress: {
    skillId: string;
    skillName: string;
    progress: number;
  }[];
};

type ParentPlanProgressSummary = {
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
};

export type ParentQuizDetails = {
  assignmentId: string;
  studentId: StudentId;
  studentName: string;
  title: string;
  dueDate: Date | null;
  questions: {
    questionId: string;
    prompt: string;
    type: QuizQuestionType;
    attachments?: string[];
    essayCharacterLimit?: number;
    options: {
      optionId: string;
      text: string;
    }[];
  }[];
  alreadySubmitted: boolean;
};

export type ParentQuizSubmissionResult = {
  quizResultId: string;
  score: number;
  status: SubmissionStatus;
  autoGradedQuestions: number;
  pendingReviewQuestions: number;
};

export type ParentAssignedQuizListItem = {
  assignmentId: string;
  studentId: StudentId;
  studentName: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  dueDate: Date | null;
  dueLabel: string | null;
  isSubmitted: boolean;
  submissionStatus: SubmissionStatus | null;
  score: number | null;
  quizResultId: string | null;
};

export type ParentQuizResultListItem = {
  quizResultId: string;
  assignmentId: string;
  studentId: StudentId;
  studentName: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  submittedAt: Date;
  score: number;
  status: SubmissionStatus;
};

export type ParentQuizResultDetail = {
  quizResultId: string;
  assignmentId?: string;
  studentId: StudentId;
  studentName: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  submittedAt: Date;
  reviewedAt?: Date;
  score: number;
  status: SubmissionStatus;
  feedback?: string;
  answers: {
    questionId: string;
    prompt: string;
    type: QuizQuestionType;
    questionAttachments?: string[];
    selectedOptionText?: string;
    correctOptionText?: string;
    essayAnswer?: string;
    essayAttachments?: string[];
    isCorrect?: boolean;
  }[];
};

@Injectable()
export class ParentsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly assignmentsRepo: SqliteAssignmentsRepo,
    private readonly attendanceRepo: InMemoryAttendancesRepo,
    private readonly gradesRepo: SqliteGradesRepo,
    private readonly plansRepo: SqlitePlansRepo,
    private readonly quizzesRepo: SqliteQuizzesRepo,
    private readonly quizResultsRepo: SqliteQuizResultsRepo,
    private readonly skillsRepo: InMemorySkillsRepo,
    private readonly baselineProcessingService: BaselineProcessingServiceService,
    private readonly supportProgramsService: SupportProgramsService,
  ) {}

  async getProfile(parentId: UserId): Promise<ParentProfileSummary> {
    const parent = await this.usersService.findById(parentId);
    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    const students = await this.studentsService.getStudents(parentId);

    return {
      parentId: parent.userId,
      fullName: parent.fullName,
      email: parent.email,
      students: students.map((student) => ({
        studentId: student.studentId,
        fullEnglishName: student.fullEnglishName,
        fullArabicName: student.fullArabicName,
        gradeId: student.gradeId,
        parentLinkCode: student.parentLinkCode,
        isActive: student.isActive,
      })),
    };
  }

  async linkStudentByCode(
    parentId: UserId,
    dto: LinkParentStudentDTO,
  ): Promise<ParentProfileSummary> {
    const parent = await this.usersService.findById(parentId);
    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    const normalizedCode = String(dto.parentStudentCode || '').trim();
    if (!normalizedCode) {
      throw new BadRequestException('Parent student code is required.');
    }

    const student = await this.studentsService.findAll().then((students) =>
      students.find(
        (item) =>
          String(item.parentLinkCode || '')
            .trim()
            .toUpperCase() === normalizedCode.toUpperCase(),
      ),
    );

    if (!student) {
      throw new NotFoundException('Parent student code is invalid.');
    }

    if (student.parentId && String(student.parentId) !== String(parentId)) {
      throw new BadRequestException(
        'This student is already linked to another parent account.',
      );
    }

    if (String(student.parentId) !== String(parentId)) {
      await this.studentsService.updateStudent(student.studentId, {
        parentId,
      });
    }

    return this.getProfile(parentId);
  }

  async getStudentDashboard(
    parentId: UserId,
    studentId: StudentId,
  ): Promise<ParentStudentDashboard> {
    const student = await this.studentsService.getById(studentId);
    if (student.parentId !== parentId) {
      throw new ForbiddenException('Parent cannot access this student.');
    }

    const [
      gradeResult,
      skillProgressResult,
      overdueQuizzesResult,
      supportProgramsResult,
      sessionsResult,
    ] = await Promise.allSettled([
      this.gradesRepo.findById(student.gradeId),
      this.getSkillProgress(student.studentId),
      this.getOverdueQuizzes(student.studentId),
      this.supportProgramsService.getStudentProgress(student.studentId),
      this.getStudentSessions(student),
    ]);

    const grade = gradeResult.status === 'fulfilled' ? gradeResult.value : null;
    const skillProgress =
      skillProgressResult.status === 'fulfilled'
        ? skillProgressResult.value
        : [];
    const overdueQuizzes =
      overdueQuizzesResult.status === 'fulfilled'
        ? overdueQuizzesResult.value
        : [];
    const supportPrograms =
      supportProgramsResult.status === 'fulfilled'
        ? supportProgramsResult.value
        : [];
    const sessions =
      sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];
    const planProgress = this.calculatePlanProgressFromSessions(sessions);

    const activeSupportProgram = supportPrograms.find(
      (program) => !program.isProgramCompleted,
    );
    const overallProgress = this.calculateOverallProgress( //comment: we already have this method in the static service
      planProgress,
      skillProgress,
    );
    const todayLearning = this.buildSessionCard(
      this.findClosestSession(sessions, 0),
    );
    const nextLesson = this.buildSessionCard(
      this.findClosestSession(sessions, 1),
    );

    return {
      studentId: student.studentId,
      studentName: student.fullEnglishName,
      studentArabicName: student.fullArabicName,
      grade: grade?.gradeName ?? student.gradeId,
      section: null,
      attendanceAverage: await this.getAttendanceAverage(student.studentId),
      overallProgress,
      isInSupportPlan: Boolean(activeSupportProgram),
      supportPlanLabel: activeSupportProgram
        ? `${student.fullEnglishName} is part of the support plan.`
        : `${student.fullEnglishName} is on track right now.`,
      todayLearning,
      nextLesson,
      overdueQuizzes,
      assignedQuizzes: await this.getAssignedQuizzes(student.studentId),
      skillProgress,
    };
  }

  async getAssignedQuiz(
    parentId: UserId,
    studentId: StudentId,
    assignmentId: string,
  ): Promise<ParentQuizDetails> {
    const { student, assignment, quiz } = await this.resolveAssignedQuiz(
      parentId,
      studentId,
      assignmentId,
    );
    const existingResults = await this.quizResultsRepo.findByStudentAndQuiz(
      student.studentId,
      quiz.quizId,
    );

    return {
      assignmentId: assignment.assignmentId,
      studentId: student.studentId,
      studentName: student.fullEnglishName,
      title: quiz.title,
      dueDate: assignment.dueDate ?? null,
      questions: quiz.questions.map((question) => ({
        questionId: question.quizQuestionId,
        prompt: question.prompt,
        type: question.type,
        attachments: question.attachments ?? [],
        essayCharacterLimit:
          question.type === QuizQuestionType.ESSAY
            ? ESSAY_ANSWER_MAX_CHARACTERS
            : undefined,
        options: question.options.map((option) => ({
          optionId: option.quizOptionId,
          text: option.text,
        })),
      })),
      alreadySubmitted: existingResults.length > 0,
    };
  }

  async submitAssignedQuiz(
    parentId: UserId,
    studentId: StudentId,
    assignmentId: string,
    dto: SubmitParentQuizDTO,
    attachmentsByField: Map<string, string[]> = new Map(),
  ): Promise<ParentQuizSubmissionResult> {
    const { student, assignment, quiz } = await this.resolveAssignedQuiz(
      parentId,
      studentId,
      assignmentId,
    );

    const existingResults = await this.quizResultsRepo.findByStudentAndQuiz(
      student.studentId,
      quiz.quizId,
    );
    if (existingResults.length > 0) {
      throw new ForbiddenException('This quiz has already been submitted.');
    }

    const answers = dto.answers ?? [];
    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );

    const gradedAnswers: QuizResultAnswer[] = quiz.questions.map((question) => {
      const answer = answerMap.get(question.quizQuestionId);

      if (question.type === QuizQuestionType.MULTIPLE_CHOICE) {
        const correctOption = question.options.find(
          (option) => option.isCorrect,
        );
        return {
          questionId: question.quizQuestionId,
          selectedOptionId: answer?.selectedOptionId,
          isCorrect:
            Boolean(correctOption) &&
            Boolean(answer?.selectedOptionId) &&
            correctOption?.quizOptionId === answer?.selectedOptionId,
        };
      }

      const trimmedEssayAnswer = answer?.essayAnswer?.trim() || '';
      if (trimmedEssayAnswer.length > ESSAY_ANSWER_MAX_CHARACTERS) {
        throw new BadRequestException(
          `Essay answers cannot exceed ${ESSAY_ANSWER_MAX_CHARACTERS} characters.`,
        );
      }

      const essayAttachmentFieldKey = String(
        answer?.essayAttachmentFieldKey ?? '',
      ).trim();

      return {
        questionId: question.quizQuestionId,
        essayAnswer: trimmedEssayAnswer,
        essayAttachments: essayAttachmentFieldKey
          ? attachmentsByField.get(essayAttachmentFieldKey) ?? []
          : [],
      };
    });

    const autoGradedAnswers = gradedAnswers.filter(
      (answer) => typeof answer.isCorrect === 'boolean',
    );
    const correctAutoGradedAnswers = autoGradedAnswers.filter(
      (answer) => answer.isCorrect,
    ).length;
    const pendingReviewQuestions = gradedAnswers.filter(
      (answer) => typeof answer.isCorrect !== 'boolean',
    ).length;
    const autoGradedQuestions = autoGradedAnswers.length;
    const score =
      autoGradedQuestions === 0
        ? 0
        : Math.round((correctAutoGradedAnswers / autoGradedQuestions) * 100);
    const status =
      pendingReviewQuestions > 0
        ? SubmissionStatus.PENDING_REVIEW
        : SubmissionStatus.AUTO_GRADED;

    const quizResult = await this.quizResultsRepo.create({
      quizResultId: `quiz_result_${randomUUID()}`,
      assignmentId: assignment.assignmentId,
      studentId: student.studentId,
      quizId: quiz.quizId,
      score,
      status,
      answers: gradedAnswers,
      submittedAt: new Date(),
    });

    return {
      quizResultId: quizResult.quizResultId,
      score,
      status,
      autoGradedQuestions,
      pendingReviewQuestions,
    };
  }

  async getAssignedQuizList(
    parentId: UserId,
  ): Promise<ParentAssignedQuizListItem[]> {
    const students = await this.studentsService.getStudents(parentId);
    const listItems = await Promise.all(
      students.map(async (student) => {
        const assignments = await this.assignmentsRepo.findByStudentId(
          student.studentId,
        );
        const quizAssignments = assignments.filter(
          (assignment) =>
            assignment.type === AssignmentType.QUIZ &&
            assignment.status === AssignmentStatus.PUBLISHED,
        );

        return Promise.all(
          quizAssignments.map(async (assignment) => {
            const quiz = await this.quizzesRepo.findById(assignment.sourceId);
            const results = await this.quizResultsRepo.findByStudentAndQuiz(
              student.studentId,
              assignment.sourceId,
            );
            const latestResult = results.sort(
              (left, right) =>
                new Date(right.submittedAt).getTime() -
                new Date(left.submittedAt).getTime(),
            )[0];

            return {
              assignmentId: assignment.assignmentId,
              studentId: student.studentId,
              studentName: student.fullEnglishName,
              title: assignment.title,
              subjectId: quiz?.subjectId ? String(quiz.subjectId) : null,
              subjectName: quiz?.subjectId
                ? this.getSubjectLabel(String(quiz.subjectId))
                : null,
              dueDate: assignment.dueDate ?? null,
              dueLabel: assignment.dueDate
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(assignment.dueDate))
                : null,
              isSubmitted: Boolean(latestResult),
              submissionStatus: latestResult?.status ?? null,
              score: latestResult?.score ?? null,
              quizResultId: latestResult?.quizResultId ?? null,
            };
          }),
        );
      }),
    );

    return listItems
      .flat()
      .sort(
        (left, right) =>
          (left.dueDate
            ? new Date(left.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER) -
          (right.dueDate
            ? new Date(right.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER),
      );
  }

  async getQuizResults(parentId: UserId): Promise<ParentQuizResultListItem[]> {
    const students = await this.studentsService.getStudents(parentId);
    const studentMap = new Map(
      students.map((student) => [student.studentId, student]),
    );
    const studentIds = new Set(students.map((student) => student.studentId));
    const allResults = await this.quizResultsRepo.findAll();

    const resultRows = await Promise.all(
      allResults
        .filter((result) => studentIds.has(result.studentId))
        .map(async (result) => {
          const assignment = result.assignmentId
            ? await this.assignmentsRepo.findById(result.assignmentId)
            : null;
          const quiz = await this.quizzesRepo.findById(result.quizId);
          const student = studentMap.get(result.studentId);
          if (!assignment || !student || !quiz) {
            return null;
          }

          return {
            quizResultId: result.quizResultId,
            assignmentId: assignment.assignmentId,
            studentId: student.studentId,
            studentName: student.fullEnglishName,
            title: assignment.title,
            subjectId: quiz.subjectId ? String(quiz.subjectId) : null,
            subjectName: quiz.subjectId
              ? this.getSubjectLabel(String(quiz.subjectId))
              : null,
            submittedAt: result.submittedAt,
            score: result.score,
            status: result.status,
          };
        }),
    );

    return resultRows
      .filter((row): row is ParentQuizResultListItem => Boolean(row))
      .sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() -
          new Date(left.submittedAt).getTime(),
      );
  }

  async getQuizResultDetail(
    parentId: UserId,
    quizResultId: string,
  ): Promise<ParentQuizResultDetail> {
    const quizResult = await this.quizResultsRepo.findById(quizResultId);
    if (!quizResult) {
      throw new NotFoundException('Quiz result not found.');
    }

    const student = await this.studentsService.getById(quizResult.studentId);
    if (student.parentId !== parentId) {
      throw new ForbiddenException('Parent cannot access this quiz result.');
    }

    const quiz = await this.quizzesRepo.findById(quizResult.quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    const assignment = quizResult.assignmentId
      ? await this.assignmentsRepo.findById(quizResult.assignmentId)
      : null;

    return {
      quizResultId: quizResult.quizResultId,
      assignmentId: quizResult.assignmentId,
      studentId: student.studentId,
      studentName: student.fullEnglishName,
      title: assignment?.title ?? quiz.title,
      subjectId: quiz.subjectId ? String(quiz.subjectId) : null,
      subjectName: quiz.subjectId
        ? this.getSubjectLabel(String(quiz.subjectId))
        : null,
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
        const correctOption = question.options.find(
          (option) => option.isCorrect,
        );

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

  private async getAttendanceAverage(studentId: StudentId): Promise<number> {
    const attendances = (await this.attendanceRepo.findAll()).filter(
      (attendance) => attendance.studentId === studentId,
    );
    if (attendances.length === 0) return 0;

    const presentCount = attendances.filter((attendance) =>
      String(attendance.status).toLowerCase().includes('present'),
    ).length;

    return Math.round((presentCount / attendances.length) * 100);
  }

  private async getOverdueQuizzes(studentId: StudentId) {
    const now = new Date();
    const assignments = await this.assignmentsRepo.findByStudentId(studentId);

    return assignments
      .filter(
        (assignment) =>
          assignment.type === AssignmentType.QUIZ &&
          assignment.status === AssignmentStatus.PUBLISHED &&
          assignment.dueDate &&
          new Date(assignment.dueDate) < now,
      )
      .sort(
        (left, right) =>
          new Date(left.dueDate as Date).getTime() -
          new Date(right.dueDate as Date).getTime(),
      )
      .map((assignment) => ({
        assignmentId: assignment.assignmentId,
        title: assignment.title,
        dueLabel: `Overdue: ${new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
        }).format(new Date(assignment.dueDate as Date))}`,
      }));
  }

  private async getAssignedQuizzes(studentId: StudentId) {
    const assignments = await this.assignmentsRepo.findByStudentId(studentId);
    const quizAssignments = assignments
      .filter(
        (assignment) =>
          assignment.type === AssignmentType.QUIZ &&
          assignment.status === AssignmentStatus.PUBLISHED,
      )
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      );

    return Promise.all(
      quizAssignments.map(async (assignment) => {
        const results = await this.quizResultsRepo.findByStudentAndQuiz(
          studentId,
          assignment.sourceId,
        );
        const latestResult = results.sort(
          (left, right) =>
            new Date(right.submittedAt).getTime() -
            new Date(left.submittedAt).getTime(),
        )[0];

        return {
          assignmentId: assignment.assignmentId,
          title: assignment.title,
          dueLabel: assignment.dueDate
            ? new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
              }).format(new Date(assignment.dueDate))
            : null,
          status: assignment.status,
          isSubmitted: Boolean(latestResult),
          submissionStatus: latestResult?.status ?? null,
          quizResultId: latestResult?.quizResultId ?? null,
        };
      }),
    );
  }

  private getSubjectLabel(subjectId: string): string {
    const labels: Record<string, string> = {
      '1': 'Mathematics',
      '2': 'Arabic',
    };

    return labels[String(subjectId)] ?? `Subject ${subjectId}`;
  }

  private async resolveAssignedQuiz(
    parentId: UserId,
    studentId: StudentId,
    assignmentId: string,
  ) {
    const student = await this.studentsService.getById(studentId);
    if (student.parentId !== parentId) {
      throw new ForbiddenException('Parent cannot access this student.');
    }

    const assignment = await this.assignmentsRepo.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Quiz assignment not found.');
    }

    if (!assignment.targetStudentIds.includes(student.studentId)) {
      throw new ForbiddenException(
        'Assignment does not belong to this student.',
      );
    }

    if (
      assignment.type !== AssignmentType.QUIZ ||
      assignment.status !== AssignmentStatus.PUBLISHED
    ) {
      throw new BadRequestException('Assignment is not an available quiz.');
    }

    if (assignment.sourceType !== AssignmentSourceType.TEACHER_CREATED) {
      throw new BadRequestException(
        'Only teacher-created quizzes are supported here.',
      );
    }

    const quiz = await this.quizzesRepo.findById(assignment.sourceId);
    if (!quiz) {
      throw new NotFoundException('Quiz content not found.');
    }

    return { student, assignment, quiz };
  }

  private async getStudentSessions(student: Student): Promise<Session[]> {
    const grades = await this.gradesRepo.findAll();
    const teacherIds = grades
      .filter((grade) => grade.gradeId === student.gradeId)
      .map((grade) => grade.teacherId);
    const teacherIdSet = new Set(teacherIds);
    const plans = (await this.plansRepo.findAll()).filter((plan) =>
      teacherIdSet.has(plan.teacherId),
    );

    return plans
      .flatMap((plan) => plan.sessions ?? [])
      .filter((session): session is Session =>
        this.isSchedulableSession(session),
      )
      .sort(
        (left, right) =>
          new Date(left.sessionDate).getTime() -
            new Date(right.sessionDate).getTime() ||
          left.slotNumber - right.slotNumber,
      );
  }

  private findClosestSession(
    sessions: Session[],
    offset: number,
  ): Session | null {
    const now = new Date().getTime();
    const futureSessions = sessions.filter(
      (session) =>
        this.isSchedulableSession(session) &&
        new Date(session.sessionDate).getTime() >= now &&
        (session.items ?? []).some(
          (item) =>
            item.status !== PlanItemStatus.CANCELLED &&
            item.status !== PlanItemStatus.POSTPONED,
        ),
    );

    return futureSessions[offset] ?? null;
  }

  private buildSessionCard(session: Session | null) {
    if (!session) return null;

    const activeItems = (session.items ?? []).filter(
      (item) =>
        item.status !== PlanItemStatus.CANCELLED &&
        item.status !== PlanItemStatus.POSTPONED,
    );
    if (!activeItems.length) return null;

    const firstItem = activeItems[0];
    const remainingTitles = activeItems.slice(1, 3).map((item) => item.title);
    const descriptionParts = [firstItem.title, ...remainingTitles];

    return {
      title: offsetTitle(session),
      description: descriptionParts.join(' + '),
      tag: firstItem.title,
    };

    function offsetTitle(currentSession: Session): string {
      return new Date(currentSession.sessionDate).toDateString() ===
        new Date().toDateString()
        ? "Today's Learning"
        : 'Next Lesson';
    }
  }

  private async getSkillProgress(studentId: StudentId) {
    const [results, skills] = await Promise.all([
      this.baselineProcessingService.findByStudentId(studentId),
      this.skillsRepo.findAll(),
    ]);
    const skillNameMap = new Map(
      skills.map((skill) => [skill.skillId, skill.title]),
    );

    return results.map((result) => ({
      skillId: result.skillId,
      skillName: skillNameMap.get(result.skillId) ?? result.skillId,
      progress: this.toPercent(result.skillId, result.totalScore),
    }));
  }

  private calculateOverallProgress(
    planProgress: ParentPlanProgressSummary,
    skillProgress: { progress: number }[],
  ): number {
    if (planProgress.totalItems > 0) {
      return planProgress.progressPercentage;
    }

    if (!skillProgress.length) return 0;
    return Math.round(
      skillProgress.reduce((sum, skill) => sum + skill.progress, 0) /
        skillProgress.length,
    );
  }

  private calculatePlanProgressFromSessions(
    sessions: Session[],
  ): ParentPlanProgressSummary {
    const items = sessions
      .flatMap((session) => session.items ?? [])
      .filter((item) => item.status !== PlanItemStatus.CANCELLED);

    if (!items.length) {
      return {
        totalItems: 0,
        completedItems: 0,
        progressPercentage: 0,
      };
    }

    const completedItems = items.filter(
      (item) => item.status === PlanItemStatus.COMPLETED,
    ).length;

    return {
      totalItems: items.length,
      completedItems,
      progressPercentage: Math.round((completedItems / items.length) * 100),
    };
  }

  private isSchedulableSession(
    session: Session | null | undefined,
  ): session is Session {
    if (!session) return false;

    const sessionDate = new Date(session.sessionDate);
    return (
      Number.isFinite(sessionDate.getTime()) &&
      Array.isArray(session.items) &&
      typeof session.slotNumber === 'number'
    );
  }

  private toPercent(skillId: string, totalScore: number): number {
    const maxScoreMap: Record<string, number> = {
      skill_vocal: 6,
      skill_sounds_of_letters: 8,
      skill_writing: 4,
    };
    const maxScore = maxScoreMap[skillId] ?? 100;
    if (!maxScore) return 0;
    return Math.round((totalScore / maxScore) * 100);
  }
}
