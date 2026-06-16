import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/domain/school';
import { SchoolRepository } from 'src/repositories/school.repository';
import { SchoolEntity } from './entities/school.entity';

@Injectable()
export class SqliteSchoolsRepo implements SchoolRepository {
  constructor(
    @InjectRepository(SchoolEntity)
    private readonly repository: Repository<SchoolEntity>,
  ) {}

  async create(school: School): Promise<School> {
    const entity = this.repository.create(this.normalizeSchool(school));
    return this.repository.save(entity);
  }

  async createMany(schools: School[]): Promise<School[]> {
    const savedSchools: School[] = [];

    for (const school of schools) {
      const normalizedSchool = this.normalizeSchool(school);
      const existing = await this.findById(normalizedSchool.schoolId);
      if (existing) {
        const merged = this.repository.merge(
          this.repository.create(existing),
          normalizedSchool as Partial<SchoolEntity>,
        );
        savedSchools.push(await this.repository.save(merged));
        continue;
      }

      const entity = this.repository.create(normalizedSchool);
      savedSchools.push(await this.repository.save(entity));
    }

    return savedSchools;
  }

  async findById(id: string): Promise<School | null> {
    return this.repository.findOneBy({ schoolId: String(id) });
  }

  async findByAdminUserId(adminUserId: string): Promise<School | null> {
    return this.repository.findOneBy({ adminUserId: String(adminUserId) });
  }

  async findByTeacherJoinCode(teacherJoinCode: string): Promise<School | null> {
    return this.repository.findOneBy({
      teacherJoinCode: String(teacherJoinCode),
    });
  }

  async findAll(): Promise<School[]> {
    return this.repository.find();
  }

  async update(id: string, patch: Partial<School>): Promise<School | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = this.repository.merge(
      this.repository.create(existing),
      this.normalizeSchoolPatch(patch) as Partial<SchoolEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ schoolId: String(id) });
    return Boolean(result.affected);
  }

  private normalizeSchool(school: School): School {
    return {
      ...school,
      schoolId: String(school.schoolId),
      schoolName: String(school.schoolName ?? '').trim(),
      adminUserId:
        school.adminUserId === undefined || school.adminUserId === null
          ? undefined
          : String(school.adminUserId),
      teacherJoinCode:
        school.teacherJoinCode === undefined || school.teacherJoinCode === null
          ? undefined
          : String(school.teacherJoinCode).trim(),
    };
  }

  private normalizeSchoolPatch(patch: Partial<School>): Partial<School> {
    return {
      ...patch,
      schoolName:
        patch.schoolName === undefined
          ? patch.schoolName
          : String(patch.schoolName).trim(),
      adminUserId:
        patch.adminUserId === undefined || patch.adminUserId === null
          ? patch.adminUserId
          : String(patch.adminUserId),
      teacherJoinCode:
        patch.teacherJoinCode === undefined || patch.teacherJoinCode === null
          ? patch.teacherJoinCode
          : String(patch.teacherJoinCode).trim(),
    };
  }
}
