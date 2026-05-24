import { School } from 'src/domain/school';

export interface SchoolRepository {
  create(school: School): Promise<School>;
  findById(id: string): Promise<School | null>;
  findByAdminUserId(adminUserId: string): Promise<School | null>;
  findByTeacherJoinCode(teacherJoinCode: string): Promise<School | null>;
  findAll(): Promise<School[]>;
  update(id: string, patch: Partial<School>): Promise<School | null>;
  delete(id: string): Promise<boolean>;
}
