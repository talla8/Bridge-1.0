import { Column, Entity, PrimaryColumn } from 'typeorm';
import {
  AssignmentSourceType,
  AssignmentStatus,
  AssignmentTargetType,
  AssignmentType,
} from 'src/domain/assignment';

@Entity({ name: 'assignments' })
export class AssignmentEntity {
  @PrimaryColumn({ name: 'assignment_id', type: 'text' })
  assignmentId: string;

  @Column({ name: 'teacher_id', type: 'text' })
  teacherId: string;

  @Column({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  type: AssignmentType;

  @Column({ name: 'source_type', type: 'text' })
  sourceType: AssignmentSourceType;

  @Column({ name: 'source_id', type: 'text' })
  sourceId: string;

  @Column({ name: 'target_type', type: 'text' })
  targetType: AssignmentTargetType;

  @Column({ name: 'target_student_ids_json', type: 'text' })
  targetStudentIdsJson: string;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'text' })
  status: AssignmentStatus;
}
