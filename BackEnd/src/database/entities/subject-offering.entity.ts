import { Column, Entity, PrimaryColumn } from 'typeorm';
import { SubjectOffering } from 'src/domain/subjectOffering';

@Entity({ name: 'subject_offerings' })
export class SubjectOfferingEntity implements SubjectOffering {
  @PrimaryColumn({ name: 'subject_offering_id', type: 'text' })
  subjectOfferingId: string;

  @Column({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ name: 'grade_id', type: 'text' })
  gradeId: string;

  @Column({ name: 'teacher_id', type: 'text' })
  teacherId: string;

  @Column({ name: 'school_id', type: 'text' })
  schoolId: string;

  @Column({ name: 'school_year', type: 'text' })
  schoolYear: string;
}
