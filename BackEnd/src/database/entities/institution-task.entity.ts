import { Column, Entity, PrimaryColumn } from 'typeorm';
import {
  InstitutionTask,
  InstitutionTaskSubmission,
  InstitutionTaskStatus,
} from 'src/institutions/domain/institution-task';

@Entity({ name: 'institution_tasks' })
export class InstitutionTaskEntity implements InstitutionTask {
  @PrimaryColumn({ name: 'task_id', type: 'text' })
  taskId: string;

  @Column({ name: 'school_id', type: 'text' })
  schoolId: string;

  @Column({ name: 'created_by_user_id', type: 'text' })
  createdByUserId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'assigned_teacher_user_ids', type: 'simple-json' })
  assignedTeacherUserIds: string[];

  @Column({ type: 'simple-json', nullable: true })
  attachments?: string[];

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'text' })
  status: InstitutionTaskStatus;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden?: boolean;

  @Column({ type: 'simple-json', nullable: true })
  submissions?: InstitutionTaskSubmission[];

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
