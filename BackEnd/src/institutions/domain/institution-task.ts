import { SchoolId, UserId } from 'src/domain/ids';

export enum InstitutionTaskStatus {
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
}

export class InstitutionTask {
  taskId: string;
  schoolId: SchoolId;
  createdByUserId: UserId;
  title: string;
  description?: string;
  assignedTeacherUserIds: UserId[];
  dueDate?: Date;
  status: InstitutionTaskStatus;
  createdAt: Date;
}
