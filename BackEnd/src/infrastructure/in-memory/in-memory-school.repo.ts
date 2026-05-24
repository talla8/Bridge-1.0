import { Injectable } from '@nestjs/common';
import { School } from 'src/domain/school';
import { SchoolRepository } from 'src/repositories/school.repository';

@Injectable()
export class InMemorySchoolsRepo implements SchoolRepository {
  private schools: School[] = [];

  async create(school: School): Promise<School> {
    this.schools.push(school);
    return school;
  }

  async findById(id: string): Promise<School | null> {
    return (
      this.schools.find(
        (school: School): boolean => String(school.schoolId) === String(id),
      ) ?? null
    );
  }

  async findByAdminUserId(adminUserId: string): Promise<School | null> {
    return (
      this.schools.find(
        (school: School): boolean =>
          String(school.adminUserId) === String(adminUserId),
      ) ?? null
    );
  }

  async findByTeacherJoinCode(
    teacherJoinCode: string,
  ): Promise<School | null> {
    return (
      this.schools.find(
        (school: School): boolean =>
          String(school.teacherJoinCode) === String(teacherJoinCode),
      ) ?? null
    );
  }

  async findAll(): Promise<School[]> {
    return this.schools;
  }

  async update(id: string, patch: Partial<School>): Promise<School | null> {
    const index = this.schools.findIndex(
      (item: School): boolean => String(item.schoolId) === String(id),
    );
    if (index === -1) return null;

    const updated: School = { ...this.schools[index], ...patch };
    this.schools[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.schools.findIndex(
      (item: School): boolean => String(item.schoolId) === String(id),
    );
    if (index === -1) return false;

    this.schools.splice(index, 1);
    return true;
  }
}
