import { AdminRepository } from 'src/repositories/admin.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryAdminsRepo implements AdminRepository {
  private admins: any[] = [];

  async create(admin: any): Promise<any> {
    this.admins.push(admin);
    return admin;
  }

  async findById(id: string): Promise<any | null> {
    return this.admins.find(function (admin: any): boolean {
      return admin.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.admins;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.admins.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.admins[index];
    const updated = { ...current, ...patch };
    this.admins[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.admins.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.admins.splice(index, 1);
    return true;
  }
}
