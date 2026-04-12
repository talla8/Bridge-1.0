import {
  QuizId,
  QuizResultId,
  StudentId,
  SupportProgramId,
  SupportProgramMilestoneId,
} from './ids';

export class QuizResult {
  quizResultId: QuizResultId;
  studentId: StudentId;
  supportProgramId: SupportProgramId;
  milestoneId: SupportProgramMilestoneId;
  quizId: QuizId;
  score: number;
  submittedAt: Date;
}
