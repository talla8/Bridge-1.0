import { Assignment } from 'src/domain/assignment';

export interface AssignmentRepository {
  create(assignment: Assignment): Promise<Assignment>;
  findById(id: string): Promise<Assignment | null>;
  findAll(): Promise<Assignment[]>;
  findByTeacherId(teacherId: string): Promise<Assignment[]>;
  findByStudentId(studentId: string): Promise<Assignment[]>;
  update(id: string, patch: Partial<Assignment>): Promise<Assignment | null>;
  delete(id: string): Promise<boolean>;
}
