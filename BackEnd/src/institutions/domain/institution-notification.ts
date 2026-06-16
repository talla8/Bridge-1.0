import { SchoolId, UserId } from 'src/domain/ids';

export enum InstitutionNotificationSenderRole {
  INSTITUTION = 'INSTITUTION',
  TEACHER = 'TEACHER',
}

export class InstitutionNotification {
  notificationId: string;
  schoolId: SchoolId;
  createdByUserId: UserId;
  title: string;
  message: string;
  recipientTeacherUserIds?: UserId[];
  senderRole: InstitutionNotificationSenderRole;
  attachments?: string[];
  createdAt: Date;
}
