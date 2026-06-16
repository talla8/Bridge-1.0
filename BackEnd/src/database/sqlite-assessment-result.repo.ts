import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { AssesmentResultRepository } from 'src/repositories/assesmentResult.repository';
import { AssessmentResultEntity } from './entities/assessment-result.entity';

@Injectable()
export class SqliteAssessmentResultsRepo implements AssesmentResultRepository {
  constructor(
    @InjectRepository(AssessmentResultEntity)
    private readonly repository: Repository<AssessmentResultEntity>,
  ) {}

  async create(assesmentResult: AssesmentResult): Promise<AssesmentResult> {
    const entity = this.repository.create(
      this.normalizeAssessmentResult(assesmentResult),
    );
    return this.repository.save(entity);
  }

  async createAssesmentResult(
    assesmentResults: AssesmentResult[],
  ): Promise<AssesmentResult[]> {
    const savedResults: AssesmentResult[] = [];

    for (const assesmentResult of assesmentResults) {
      const normalizedResult =
        this.normalizeAssessmentResult(assesmentResult);
      const existing = await this.findById(normalizedResult.resultId);

      if (existing) {
        const merged = this.repository.merge(
          this.repository.create(existing),
          normalizedResult as Partial<AssessmentResultEntity>,
        );
        savedResults.push(await this.repository.save(merged));
        continue;
      }

      const entity = this.repository.create(normalizedResult);
      savedResults.push(await this.repository.save(entity));
    }

    return savedResults;
  }

  async findById(id: string): Promise<AssesmentResult | null> {
    return this.repository.findOneBy({ resultId: String(id) });
  }

  async findByUploadId(id: string): Promise<AssesmentResult | null> {
    return this.repository.findOne({
      where: { uploadId: String(id) },
      order: { resultId: 'ASC' },
    });
  }

  async findByStudentId(id: string): Promise<AssesmentResult[]> {
    return this.repository.findBy({ studentId: String(id) });
  }

  async findAll(): Promise<AssesmentResult[]> {
    return this.repository.find({
      order: {
        resultId: 'ASC',
      },
    });
  }

  async update(
    id: string,
    patch: Partial<AssesmentResult>,
  ): Promise<AssesmentResult | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const normalizedPatch = this.normalizeAssessmentResultPatch(patch);
    const merged = this.repository.merge(
      this.repository.create(existing),
      normalizedPatch as Partial<AssessmentResultEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ resultId: String(id) });
    return true;
  }

  private normalizeAssessmentResult(
    assesmentResult: AssesmentResult,
  ): AssesmentResult {
    return {
      ...assesmentResult,
      resultId: String(assesmentResult.resultId),
      uploadId: String(assesmentResult.uploadId),
      studentId: String(assesmentResult.studentId),
      skillId: String(assesmentResult.skillId),
      totalScore: Number(assesmentResult.totalScore),
      level: String(assesmentResult.level),
    };
  }

  private normalizeAssessmentResultPatch(
    patch: Partial<AssesmentResult>,
  ): Partial<AssesmentResult> {
    return {
      ...patch,
      uploadId:
        patch.uploadId === undefined || patch.uploadId === null
          ? patch.uploadId
          : String(patch.uploadId),
      studentId:
        patch.studentId === undefined || patch.studentId === null
          ? patch.studentId
          : String(patch.studentId),
      skillId:
        patch.skillId === undefined || patch.skillId === null
          ? patch.skillId
          : String(patch.skillId),
      totalScore:
        patch.totalScore === undefined || patch.totalScore === null
          ? patch.totalScore
          : Number(patch.totalScore),
      level:
        patch.level === undefined || patch.level === null
          ? patch.level
          : String(patch.level),
    };
  }
}
