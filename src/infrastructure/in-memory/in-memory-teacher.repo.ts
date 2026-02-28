import { TeacherRepository } from 'src/repositories/teacher.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryTeachersRepo implements TeacherRepository {
  private teachers: any[] = [];

  async create(teacher: any): Promise<any> {
    this.teachers.push(teacher);
    return teacher;
  }

  async findById(id: string): Promise<any | null> {
    return this.teachers.find(function (teacher: any): boolean {
      return teacher.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.teachers;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.teachers.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.teachers[index];
    const updated = { ...current, ...patch };
    this.teachers[index] = updated;
    return updated;
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.teachers.find(function (teacher: any): boolean {
      return teacher.email === email;
    });
  }

    async existsByEmail(email: string): Promise <any|null>{
        const result: boolean = this.teachers.find(function (teacher: any): boolean {
      return teacher.email === email;
    });
    if (result)
      return true; 
  } //need rewriting : logic is working right 

  async delete(id: string): Promise<boolean> {
    const index = this.teachers.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.teachers.splice(index, 1);
    return true;
  }
}
