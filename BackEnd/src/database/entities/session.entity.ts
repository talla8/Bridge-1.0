import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sessions' })
export class SessionEntity {
  @PrimaryColumn({ name: 'session_id', type: 'text' })
  sessionId: string;

  @Column({ name: 'teacher_id', type: 'text' })
  teacherId: string;

  @Column({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ type: 'text' })
  day: string;

  @Column({ name: 'items_json', type: 'text' })
  itemsJson: string;

  @Column({ name: 'max_duration', type: 'integer' })
  maxDuration: number;

  @Column({ name: 'used_duration', type: 'integer' })
  usedDuration: number;

  @Column({ name: 'review_buffer_minutes', type: 'integer' })
  reviewBufferMinutes: number;

  @Column({ name: 'slot_number', type: 'integer' })
  slotNumber: number;

  @Column({ name: 'session_date', type: 'datetime' })
  sessionDate: Date;

  @Column({ name: 'session_week_no', type: 'integer' })
  sessionWeekNo: number;
}
