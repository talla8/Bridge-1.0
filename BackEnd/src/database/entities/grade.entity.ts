import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Grade, GradeName } from 'src/domain/grade';

@Entity({ name: 'grades' })
export class GradeEntity implements Grade {
  @Column({ name: 'grade_id', type: 'text' })
  gradeId: string;

  @Column({ name: 'grade_name', type: 'text' })
  gradeName: GradeName;

  @Column({ name: 'grade_section', type: 'text', nullable: true })
  gradeSection?: string | null;

  @Column({ name: 'school_name', type: 'text', nullable: true })
  schoolName?: string | null;

  @PrimaryColumn({ name: 'teacher_id', type: 'text' })
  teacherId: string;
}
