import { StudentId } from 'src/domain/ids';

export type MilestoneProgressSummary = {
  studentId: StudentId;
  supportProgramId: string;
  milestoneId: string;
  requiredQuizCount: number;
  completedQuizCount: number;
  requiredAverageScore: number;
  currentAverageScore: number;
  isCompleted: boolean;
  remainingQuizCount: number;
};
