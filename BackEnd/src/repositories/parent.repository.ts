import { User } from 'src/domain/user';

export interface ParentRepository {
  create(parent: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  findAll(): Promise<User[]>;
  update(id: string, patch: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

//should i add sth to find the relation? or children ?
