import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user';
import { ParentRepository } from 'src/repositories/parent.repository';

@Injectable()
export class InMemoryParentsRepo implements ParentRepository {
  private parents: User[] = [];

  async create(parent: User): Promise<User> {
    this.parents.push(parent);
    return parent;
  }

  async findById(id: string): Promise<User | null> {
    return this.parents.find((parent: User): boolean => parent.userId === id) ?? null;
  }

  async findByEmail(email: string): Promise<User> {
    const parent = this.parents.find((item: User): boolean => item.email === email);
    if (!parent) {
      throw new Error('Parent not found');
    }
    return parent;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.parents.some((user: User): boolean => user.email === email);
  }

  async findAll(): Promise<User[]> {
    return this.parents;
  }

  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const index = this.parents.findIndex((item: User): boolean => item.userId === id);
    if (index === -1) return null;

    const updated: User = { ...this.parents[index], ...patch };
    this.parents[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.parents.findIndex((item: User): boolean => item.userId === id);
    if (index === -1) return false;

    this.parents.splice(index, 1);
    return true;
  }
}
