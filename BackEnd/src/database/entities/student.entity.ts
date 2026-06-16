import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ParentRelation, Student } from 'src/domain/student';

@Entity({ name: 'students' })
export class StudentEntity implements Student {
  @PrimaryColumn({ name: 'student_id', type: 'text' })
  studentId: string;

  @Column({ name: 'full_english_name', type: 'text' })
  fullEnglishName: string;

  @Column({ name: 'full_arabic_name', type: 'text' })
  fullArabicName: string;

  @Column({ name: 'national_id', type: 'text' })
  nationalId: string;

  @Column({ name: 'teacher_id', type: 'text', nullable: true })
  teacherId?: string;

  @Column({ name: 'parent_id', type: 'text', nullable: true })
  parentId?: string;

  @Column({ name: 'parent_link_code', type: 'text' })
  parentLinkCode: string;

  @Column({ name: 'grade_id', type: 'text' })
  gradeId: string;

  @Column({ name: 'school_name', type: 'text', nullable: true })
  schoolName?: string;

  @Column({ name: 'parent_relation', type: 'text', nullable: true })
  parentRelation?: ParentRelation;

  @Column({ name: 'is_active', type: 'boolean' })
  isActive: boolean;
}
