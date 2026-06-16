import { Column, Entity, PrimaryColumn } from 'typeorm';
import {
  InstitutionNotification,
  InstitutionNotificationSenderRole,
} from 'src/institutions/domain/institution-notification';

@Entity({ name: 'institution_notifications' })
export class InstitutionNotificationEntity
  implements InstitutionNotification
{
  @PrimaryColumn({ name: 'notification_id', type: 'text' })
  notificationId: string;

  @Column({ name: 'school_id', type: 'text' })
  schoolId: string;

  @Column({ name: 'created_by_user_id', type: 'text' })
  createdByUserId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    name: 'recipient_teacher_user_ids',
    type: 'simple-json',
    nullable: true,
  })
  recipientTeacherUserIds?: string[];

  @Column({
    name: 'sender_role',
    type: 'simple-enum',
    enum: InstitutionNotificationSenderRole,
  })
  senderRole: InstitutionNotificationSenderRole;

  @Column({ type: 'simple-json', nullable: true })
  attachments?: string[];

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
