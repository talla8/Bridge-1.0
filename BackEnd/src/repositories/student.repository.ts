import { Student } from 'src/domain/student';

export interface StudentRepository {
  create(student: Student): Promise<Student>;
  createMany(students: Student[]): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  findByArabicName(name: string): Promise<Student[]>;
  findAll(): Promise<Student[]>;
  findByParentId(parentId: string): Promise<Student[]>;
  findByGradeId(gradeId: string): Promise<Student[]>;
  update(id: string, patch: Partial<Student>): Promise<Student | null>;
  delete(id: string): Promise<boolean>;
}
