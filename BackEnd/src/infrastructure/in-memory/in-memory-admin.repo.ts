import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user';
import { AdminRepository } from 'src/repositories/admin.repository';

@Injectable()
export class InMemoryAdminsRepo implements AdminRepository {
  private admins: User[] = [];

  async create(admin: User): Promise<User> {
    this.admins.push(admin);
    return admin;
  }

  async findById(id: string): Promise<User | null> {
    return (
      this.admins.find((admin: User): boolean => admin.userId === id) ?? null
    );
  }

  async findAll(): Promise<User[]> {
    return this.admins;
  }

  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const index = this.admins.findIndex(
      (item: User): boolean => item.userId === id,
    );
    if (index === -1) return null;

    const updated: User = { ...this.admins[index], ...patch };
    this.admins[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.admins.findIndex(
      (item: User): boolean => item.userId === id,
    );
    if (index === -1) return false;

    this.admins.splice(index, 1);
    return true;
  }
}
