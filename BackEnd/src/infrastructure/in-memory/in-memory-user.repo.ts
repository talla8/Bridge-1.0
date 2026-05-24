import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class InMemoryUsersRepo implements UserRepository {
  private users: User[] = [];

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user: User): boolean => user.email === email) ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some((user: User): boolean => user.email === email);
  }

  async findAll(filters?: {
    role?: string;
    isActive?: boolean | string;
    search?: string;
  }): Promise<User[]> {
    if (!filters) return this.users;

    const role = filters.role?.toLowerCase();
    const search = filters.search?.toLowerCase();
    const isActive =
      typeof filters.isActive === 'string'
        ? filters.isActive.toLowerCase() === 'true'
        : filters.isActive;

    return this.users.filter((user: User): boolean => {
      const roleOk = role ? String(user.roleId ?? '').toLowerCase() === role : true;
      const activeOk =
        isActive !== undefined ? Boolean(user.isActive) === Boolean(isActive) : true;
      const searchOk = search
        ? user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        : true;

      return roleOk && activeOk && searchOk;
    });
  }

  async findById(id: string): Promise<User | null> {
    return (
      this.users.find(
        (user: User): boolean => String(user.userId) === String(id),
      ) ?? null
    );
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(
      (user: User): boolean => String(user.userId) === String(id),
    );
    if (index === -1) return false;

    this.users[index] = {
      ...this.users[index],
      isActive: false,
    };
    return true;
  }

  async update(
    id: string,
    patch: Partial<Omit<User, 'userId'>>,
  ): Promise<User | null> {
    const index = this.users.findIndex(
      (user: User): boolean => String(user.userId) === String(id),
    );
    if (index === -1) return null;

    const updated: User = { ...this.users[index], ...patch };
    this.users[index] = updated;

    return updated;
  }

  async exists(id: string): Promise<boolean> {
    return this.users.some(
      (user: User): boolean => String(user.userId) === String(id),
    );
  }
}
