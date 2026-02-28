import { User } from 'src/domain/user';

export interface UserRepository {
  create(user: User): Promise<User>;

  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<boolean>;

  findAll(filters?: {
    role?: string;
    isActive?: boolean | string;
    search?: string;
  }): Promise<any[]>;

  findByEmail(email: string): Promise<User | null>;

  existsByEmail(email: string): Promise<User | null>;

  update(
    id: string,
    patch: Partial<Omit<any, 'id' | 'CreatedAt'>>,
  ): Promise<User | null>;

  exists(id: string): Promise<User | null>;
}
