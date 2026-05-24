import {
  QuizId,
  QuizOptionId,
  QuizQuestionId,
  SupportProgramId,
  SupportProgramMilestoneId,
  SubjectId,
  UserId,
} from './ids';

export class QuizOption {
  quizOptionId: QuizOptionId;
  text: string;
  isCorrect: boolean;
}

export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
}

export class QuizQuestion {
  quizQuestionId: QuizQuestionId;
  prompt: string;
  type: QuizQuestionType;
  options: QuizOption[];
}

export class Quiz {
  quizId: QuizId;
  teacherId?: UserId;
  subjectId?: SubjectId;
  skillFocus?: string;
  supportProgramId?: SupportProgramId;
  milestoneId?: SupportProgramMilestoneId;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
}
