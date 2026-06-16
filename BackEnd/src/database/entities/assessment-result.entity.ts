import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AssesmentResult } from 'src/domain/assesmentResult';

@Entity({ name: 'assessment_results' })
export class AssessmentResultEntity implements AssesmentResult {
  @PrimaryColumn({ name: 'result_id', type: 'text' })
  resultId: string;

  @Column({ name: 'upload_id', type: 'text' })
  uploadId: string;

  @Column({ name: 'student_id', type: 'text' })
  studentId: string;

  @Column({ name: 'skill_id', type: 'text' })
  skillId: string;

  @Column({ name: 'total_score', type: 'integer' })
  totalScore: number;

  @Column({ type: 'text' })
  level: string;
}
