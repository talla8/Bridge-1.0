import { SchoolRepository } from 'src/repositories/school.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemorySchoolsRepo implements SchoolRepository {
  private schools: any[] = [];

  async create(school: any): Promise<any> {
    this.schools.push(school);
    return school;
  }

  async findById(id: string): Promise<any | null> {
    return this.schools.find(function (school: any): boolean {
      return school.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.schools;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.schools.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.schools[index];
    const updated = { ...current, ...patch };
    this.schools[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.schools.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.schools.splice(index, 1);
    return true;
  }
}
