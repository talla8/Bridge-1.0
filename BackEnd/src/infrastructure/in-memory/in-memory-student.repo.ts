import { Injectable } from '@nestjs/common';
import { Student } from 'src/domain/student';
import { StudentRepository } from 'src/repositories/student.repository';

@Injectable()
export class InMemoryStudentsRepo implements StudentRepository {
  private students: Student[] = [];

  async create(student: Student): Promise<Student> {
    this.students.push(student);
    return student;
  }

  async createMany(students: Student[]): Promise<Student[]> {
    this.students.push(...students);
    return students;
  }

  async findById(id: string): Promise<Student | null> {
    return (
      this.students.find(
        (student: Student): boolean => student.studentId === id,
      ) ?? null
    );
  }

  async findByArabicName(name: string): Promise<Student[]> {
    return this.students.filter(
      (student: Student): boolean => student.fullArabicName === name,
    );
  } //needs to be more flixable //fix

  async findByParentId(parentId: string): Promise<Student[]> {
    return this.students.filter(
      (student: Student): boolean => student.parentId === parentId,
    );
  }

  async findByGradeId(gradeId: string): Promise<Student[]> {
    return this.students.filter(
      (student: Student): boolean => student.gradeId === gradeId,
    );
  }

  async findAll(): Promise<Student[]> {
    return this.students;
  }

  async update(id: string, patch: Partial<Student>): Promise<Student | null> {
    const index = this.students.findIndex(
      (item: Student): boolean => item.studentId === id,
    );
    if (index === -1) {
      return null;
    }

    const updated: Student = { ...this.students[index], ...patch };
    this.students[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.students.findIndex(
      (item: Student): boolean => item.studentId === id,
    );
    if (index === -1) return false;

    this.students.splice(index, 1);
    return true;
  }
}
