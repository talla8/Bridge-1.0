import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from 'src/domain/grade';
import { UserId } from 'src/domain/ids';
import { GradeRepository } from 'src/repositories/grade.repository';
import { GradeEntity } from './entities/grade.entity';

@Injectable()
export class SqliteGradesRepo implements GradeRepository {
  constructor(
    @InjectRepository(GradeEntity)
    private readonly repository: Repository<GradeEntity>,
  ) {}

  async create(grade: Grade): Promise<Grade> {
    const normalizedGrade = this.normalizeGrade(grade);
    const existing = await this.findByTeacherId(normalizedGrade.teacherId);

    if (existing) {
      const merged = this.repository.merge(
        this.repository.create(existing),
        normalizedGrade as Partial<GradeEntity>,
      );
      return this.repository.save(merged);
    }

    const entity = this.repository.create(normalizedGrade);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Grade | null> {
    return this.repository.findOneBy({ gradeId: String(id) });
  }

  async findByTeacherId(teacherId: UserId): Promise<Grade | null> {
    return this.repository.findOneBy({ teacherId: String(teacherId) });
  }

  async findAll(): Promise<Grade[]> {
    return this.repository.find();
  }

  async update(id: string, patch: Partial<Grade>): Promise<Grade | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = this.repository.merge(
      this.repository.create(existing),
      this.normalizeGradePatch(patch) as Partial<GradeEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await this.repository.delete({ teacherId: String(existing.teacherId) });
    return true;
  }

  private normalizeGrade(grade: Grade): Grade {
    return {
      ...grade,
      gradeId: String(grade.gradeId),
      gradeName: grade.gradeName,
      gradeSection:
        grade.gradeSection === undefined || grade.gradeSection === null
          ? grade.gradeSection
          : String(grade.gradeSection).trim(),
      schoolName:
        grade.schoolName === undefined || grade.schoolName === null
          ? grade.schoolName
          : String(grade.schoolName).trim(),
      teacherId: String(grade.teacherId),
    };
  }

  private normalizeGradePatch(patch: Partial<Grade>): Partial<Grade> {
    return {
      ...patch,
      gradeId:
        patch.gradeId === undefined || patch.gradeId === null
          ? patch.gradeId
          : String(patch.gradeId),
      gradeSection:
        patch.gradeSection === undefined || patch.gradeSection === null
          ? patch.gradeSection
          : String(patch.gradeSection).trim(),
      schoolName:
        patch.schoolName === undefined || patch.schoolName === null
          ? patch.schoolName
          : String(patch.schoolName).trim(),
      teacherId:
        patch.teacherId === undefined || patch.teacherId === null
          ? patch.teacherId
          : String(patch.teacherId),
    };
  }
}
