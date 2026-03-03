import { Grade } from 'src/domain/grade';
import { UserId } from 'src/domain/ids';

export interface GradeRepository {
  create(grade: Grade): Promise<Grade>;
  findById(id: string): Promise<Grade | null>;
  findByTeacherId(teacherId: UserId): Promise<Grade | null>;
  findAll(): Promise<Grade[]>;
  update(id: string, patch: Partial<Grade>): Promise<Grade | null>;
  delete(id: string): Promise<boolean>;
}
