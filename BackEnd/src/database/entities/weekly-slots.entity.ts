import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'weekly_slots' })
export class WeeklySlotsEntity {
  @PrimaryColumn({ name: 'teacher_id', type: 'text' })
  teacherId: string;

  @PrimaryColumn({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ name: 'slots_json', type: 'text' })
  slotsJson: string;
}
