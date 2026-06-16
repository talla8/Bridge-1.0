import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectOffering } from 'src/domain/subjectOffering';
import { SubjectOfferingRepository } from 'src/repositories/subjectOffering.repository';
import { SubjectOfferingEntity } from './entities/subject-offering.entity';

@Injectable()
export class SqliteSubjectOfferingsRepo implements SubjectOfferingRepository {
  constructor(
    @InjectRepository(SubjectOfferingEntity)
    private readonly repository: Repository<SubjectOfferingEntity>,
  ) {}

  async create(subjectOffering: SubjectOffering): Promise<SubjectOffering> {
    const entity = this.repository.create(
      this.normalizeSubjectOffering(subjectOffering),
    );
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<SubjectOffering | null> {
    return this.repository.findOneBy({ subjectOfferingId: String(id) });
  }

  async findAll(): Promise<SubjectOffering[]> {
    return this.repository.find({
      order: {
        subjectOfferingId: 'ASC',
      },
    });
  }

  async update(
    id: string,
    patch: Partial<SubjectOffering>,
  ): Promise<SubjectOffering | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = this.repository.merge(
      this.repository.create(existing),
      this.normalizeSubjectOfferingPatch(patch) as Partial<SubjectOfferingEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ subjectOfferingId: String(id) });
    return true;
  }

  private normalizeSubjectOffering(
    subjectOffering: SubjectOffering,
  ): SubjectOffering {
    return {
      ...subjectOffering,
      subjectOfferingId: String(subjectOffering.subjectOfferingId),
      subjectId: String(subjectOffering.subjectId),
      gradeId: String(subjectOffering.gradeId),
      teacherId: String(subjectOffering.teacherId),
      schoolId: String(subjectOffering.schoolId),
      schoolYear: String(subjectOffering.schoolYear),
    };
  }

  private normalizeSubjectOfferingPatch(
    patch: Partial<SubjectOffering>,
  ): Partial<SubjectOffering> {
    return {
      ...patch,
      subjectId:
        patch.subjectId === undefined || patch.subjectId === null
          ? patch.subjectId
          : String(patch.subjectId),
      gradeId:
        patch.gradeId === undefined || patch.gradeId === null
          ? patch.gradeId
          : String(patch.gradeId),
      teacherId:
        patch.teacherId === undefined || patch.teacherId === null
          ? patch.teacherId
          : String(patch.teacherId),
      schoolId:
        patch.schoolId === undefined || patch.schoolId === null
          ? patch.schoolId
          : String(patch.schoolId),
      schoolYear:
        patch.schoolYear === undefined || patch.schoolYear === null
          ? patch.schoolYear
          : String(patch.schoolYear),
    };
  }
}
