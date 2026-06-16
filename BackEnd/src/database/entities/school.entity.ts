import { Column, Entity, PrimaryColumn } from 'typeorm';
import { School } from 'src/domain/school';

@Entity({ name: 'schools' })
export class SchoolEntity implements School {
  @PrimaryColumn({ name: 'school_id', type: 'text' })
  schoolId: string;

  @Column({ name: 'school_name', type: 'text' })
  schoolName: string;

  @Column({ name: 'admin_user_id', type: 'text', nullable: true })
  adminUserId?: string;

  @Column({ name: 'teacher_join_code', type: 'text', nullable: true })
  teacherJoinCode?: string;

  @Column({
    name: 'teacher_self_registration_enabled',
    type: 'boolean',
    nullable: true,
  })
  teacherSelfRegistrationEnabled?: boolean;
}
