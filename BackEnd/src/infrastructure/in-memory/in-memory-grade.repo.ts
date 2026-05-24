import { Injectable } from '@nestjs/common';
import { Grade } from 'src/domain/grade';
import { UserId } from 'src/domain/ids';
import { GradeRepository } from 'src/repositories/grade.repository';

@Injectable()
export class InMemoryGradesRepo implements GradeRepository {
  private grades: Grade[] = [];

  async create(grade: Grade): Promise<Grade> {
    this.grades.push(grade);
    return grade;
  }

  async findById(id: string): Promise<Grade | null> {
    return (
      this.grades.find(
        (grade: Grade): boolean => String(grade.gradeId) === String(id),
      ) ?? null
    );
  }

  async findByTeacherId(teacherId: UserId): Promise<Grade | null> {
    return (
      this.grades.find(
        (grade: Grade): boolean =>
          String(grade.teacherId) === String(teacherId),
      ) ?? null
    );
  }

  async findAll(): Promise<Grade[]> {
    return this.grades;
  }

  async update(id: string, patch: Partial<Grade>): Promise<Grade | null> {
    const index = this.grades.findIndex(
      (item: Grade): boolean => String(item.gradeId) === String(id),
    );
    if (index === -1) return null;

    const updated: Grade = { ...this.grades[index], ...patch };
    this.grades[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.grades.findIndex(
      (item: Grade): boolean => String(item.gradeId) === String(id),
    );
    if (index === -1) return false;

    this.grades.splice(index, 1);
    return true;
  }
}
