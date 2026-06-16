import { Column, Entity, PrimaryColumn } from 'typeorm';
import { SubmissionStatus } from 'src/domain/quiz-result';

@Entity({ name: 'quiz_results' })
export class QuizResultEntity {
  @PrimaryColumn({ name: 'quiz_result_id', type: 'text' })
  quizResultId: string;

  @Column({ name: 'assignment_id', type: 'text', nullable: true })
  assignmentId?: string;

  @Column({ name: 'student_id', type: 'text' })
  studentId: string;

  @Column({ name: 'support_program_id', type: 'text', nullable: true })
  supportProgramId?: string;

  @Column({ name: 'milestone_id', type: 'text', nullable: true })
  milestoneId?: string;

  @Column({ name: 'quiz_id', type: 'text' })
  quizId: string;

  @Column({ type: 'integer' })
  score: number;

  @Column({ type: 'text' })
  status: SubmissionStatus;

  @Column({ name: 'answers_json', type: 'text' })
  answersJson: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ name: 'submitted_at', type: 'datetime' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt?: Date;
}
