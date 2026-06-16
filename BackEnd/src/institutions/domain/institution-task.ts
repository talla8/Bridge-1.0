import { SchoolId, UserId } from 'src/domain/ids';

export enum InstitutionTaskStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export class InstitutionTaskSubmission {
  teacherUserId: UserId;
  submittedAt: Date;
  message?: string;
  attachments?: string[];
}

export class InstitutionTask {
  taskId: string;
  schoolId: SchoolId;
  createdByUserId: UserId;
  title: string;
  description?: string;
  assignedTeacherUserIds: UserId[];
  attachments?: string[];
  dueDate?: Date;
  status: InstitutionTaskStatus;
  isHidden?: boolean;
  submissions?: InstitutionTaskSubmission[];
  createdAt: Date;
}
