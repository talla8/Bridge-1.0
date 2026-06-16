import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'quizzes' })
export class QuizEntity {
  @PrimaryColumn({ name: 'quiz_id', type: 'text' })
  quizId: string;

  @Column({ name: 'teacher_id', type: 'text', nullable: true })
  teacherId?: string;

  @Column({ name: 'subject_id', type: 'text', nullable: true })
  subjectId?: string;

  @Column({ name: 'skill_focus', type: 'text', nullable: true })
  skillFocus?: string;

  @Column({ name: 'support_program_id', type: 'text', nullable: true })
  supportProgramId?: string;

  @Column({ name: 'milestone_id', type: 'text', nullable: true })
  milestoneId?: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'questions_json', type: 'text' })
  questionsJson: string;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
