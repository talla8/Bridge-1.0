import { GradeRepository } from 'src/repositories/grade.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryGradesRepo implements GradeRepository {
  private grades: any[] = [];

  async create(grade: any): Promise<any> {
    this.grades.push(grade);
    return grade;
  }

  async findById(id: string): Promise<any | null> {
    return this.grades.find(function (grade: any): boolean {
      return grade.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.grades;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.grades.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.grades[index];
    const updated = { ...current, ...patch };
    this.grades[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.grades.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.grades.splice(index, 1);
    return true;
  }
}
