import { StudentId } from 'src/domain/ids';

export type MilestoneProgressSummary = {
  studentId: StudentId;
  supportProgramId: string;
  milestoneId: string;
  requiredExerciseCount: number;
  passedExerciseCount: number;
  remainingExerciseCount: number;
  requiredQuizScore: number;
  bestQuizScore: number;
  quizAttemptCount: number;
  hasPassedFinalQuiz: boolean;
  isCompleted: boolean;
};
