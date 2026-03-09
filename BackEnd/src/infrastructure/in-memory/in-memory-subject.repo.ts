import { Injectable } from '@nestjs/common';
import { Subject } from 'src/domain/subject';
import { SubjectRepository } from 'src/repositories/subject.repository';

@Injectable()
export class InMemorySubjectsRepo implements SubjectRepository {
  private subjects: Subject[] = [];

  async create(subject: Subject): Promise<Subject> {
    this.subjects.push(subject);
    return subject;
  }

  async findById(id: string): Promise<Subject | null> {
    return this.subjects.find((subject: Subject): boolean => subject.subjectId === id) ?? null;
  }

  async findAll(): Promise<Subject[]> {
    return this.subjects;
  }

  async update(id: string, patch: Partial<Subject>): Promise<Subject | null> {
    const index = this.subjects.findIndex((item: Subject): boolean => item.subjectId === id);
    if (index === -1) return null;

    const updated: Subject = { ...this.subjects[index], ...patch };
    this.subjects[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.subjects.findIndex((item: Subject): boolean => item.subjectId === id);
    if (index === -1) return false;

    this.subjects.splice(index, 1);
    return true;
  }
}
