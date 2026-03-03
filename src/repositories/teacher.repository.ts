import { User } from 'src/domain/user';

export interface TeacherRepository {
  create(teacher: User): Promise<User>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  findAll(): Promise<User[]>;
  update(id: string, patch: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
