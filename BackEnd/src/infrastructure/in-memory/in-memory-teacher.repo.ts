import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user';
import { TeacherRepository } from 'src/repositories/teacher.repository';

@Injectable()
export class InMemoryTeachersRepo implements TeacherRepository {
  private teachers: User[] = [];

  async create(teacher: User): Promise<User> {
    this.teachers.push(teacher);
    return teacher;
  }

  async findById(id: string): Promise<User> {
    const teacher = this.teachers.find((item: User): boolean => item.userId === id);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    return teacher;
  }

  async findByEmail(email: string): Promise<User> {
    const teacher = this.teachers.find((item: User): boolean => item.email === email);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    return teacher;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.teachers.some((teacher: User): boolean => teacher.email === email);
  }

  async findAll(): Promise<User[]> {
    return this.teachers;
  }

  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const index = this.teachers.findIndex((item: User): boolean => item.userId === id);
    if (index === -1) return null;

    const updated: User = { ...this.teachers[index], ...patch };
    this.teachers[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.teachers.findIndex((item: User): boolean => item.userId === id);
    if (index === -1) return false;

    this.teachers.splice(index, 1);
    return true;
  }
}
