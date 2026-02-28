import { SubjectRepository } from 'src/repositories/subject.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemorySubjectsRepo implements SubjectRepository {
  private subjects: any[] = [];

  async create(subject: any): Promise<any> {
    this.subjects.push(subject);
    return subject;
  }

  async findById(id: string): Promise<any | null> {
    return this.subjects.find(function (subject: any): boolean {
      return subject.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.subjects;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.subjects.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.subjects[index];
    const updated = { ...current, ...patch };
    this.subjects[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.subjects.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.subjects.splice(index, 1);
    return true;
  }
}
