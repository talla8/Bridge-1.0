import {
  ExerciseResultId,
  StudentId,
  SupportItemId,
  SupportProgramId,
  SupportProgramMilestoneId,
} from './ids';
import { SubmissionStatus } from './quiz-result';

export class ExerciseResult {
  exerciseResultId: ExerciseResultId;
  studentId: StudentId;
  supportProgramId: SupportProgramId;
  milestoneId: SupportProgramMilestoneId;
  supportItemId: SupportItemId;
  passed: boolean;
  status: SubmissionStatus;
  answer?: string;
  feedback?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}
