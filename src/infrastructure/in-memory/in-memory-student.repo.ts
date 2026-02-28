import { StudentRepository } from 'src/repositories/student.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryStudentsRepo implements StudentRepository {
  private students: any[] = [];

  async create(student: any): Promise<any> {
    this.students.push(student);
    return student;
  }

  async findById(id: string): Promise<any | null> {
    return this.students.find(function (student: any): boolean {
      return student.id === id;
    });
  }

    async findByParentId(parentid: string): Promise<any | null> {
    return this.students.find(function (student: any): boolean {
      return student.parentId === parentid;
    });
  } 

      async findByGradeId(gradeId: string): Promise<any | null> {
    return this.students.find(function (student: any): boolean {
      return student.gradeId === gradeId;
    });
  } 

  async findAll(): Promise<any[]> {
    return this.students;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.students.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.students[index];
    const updated = { ...current, ...patch };
    this.students[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.students.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.students.splice(index, 1);
    return true;
  }
}
