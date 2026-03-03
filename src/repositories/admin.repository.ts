import { User } from 'src/domain/user';

export interface AdminRepository {
  create(admin: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, patch: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
