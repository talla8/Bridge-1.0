import {
  AssignmentId,
  QuizId,
  QuizResultId,
  StudentId,
  SupportProgramId,
  SupportProgramMilestoneId,
} from './ids';

export enum SubmissionStatus {
  AUTO_GRADED = 'AUTO_GRADED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  REVIEWED = 'REVIEWED',
}

export class QuizResultAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  isCorrect?: boolean;
}

export class QuizResult {
  quizResultId: QuizResultId;
  assignmentId?: AssignmentId;
  studentId: StudentId;
  supportProgramId?: SupportProgramId;
  milestoneId?: SupportProgramMilestoneId;
  quizId: QuizId;
  score: number;
  status: SubmissionStatus;
  answers: QuizResultAnswer[];
  feedback?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}
