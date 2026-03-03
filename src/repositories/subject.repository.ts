import { Subject } from 'src/domain/subject';

export interface SubjectRepository {
  create(subject: Subject): Promise<Subject>;
  findById(id: string): Promise<Subject | null>;
  findAll(): Promise<Subject[]>;
  update(id: string, patch: Partial<Subject>): Promise<Subject | null>;
  delete(id: string): Promise<boolean>;
}
