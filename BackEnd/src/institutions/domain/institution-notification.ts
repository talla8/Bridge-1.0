import { SchoolId, UserId } from 'src/domain/ids';

export class InstitutionNotification {
  notificationId: string;
  schoolId: SchoolId;
  createdByUserId: UserId;
  title: string;
  message: string;
  recipientTeacherUserIds?: UserId[];
  createdAt: Date;
}
