import {
  QuizId,
  QuizOptionId,
  QuizQuestionId,
  SupportProgramId,
  SupportProgramMilestoneId,
} from './ids';

export class QuizOption {
  quizOptionId: QuizOptionId;
  text: string;
  isCorrect: boolean;
}

export class QuizQuestion {
  quizQuestionId: QuizQuestionId;
  prompt: string;
  options: QuizOption[];
}

export class Quiz {
  quizId: QuizId;
  supportProgramId: SupportProgramId;
  milestoneId: SupportProgramMilestoneId;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
}
