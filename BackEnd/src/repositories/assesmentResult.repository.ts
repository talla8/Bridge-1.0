import { AssesmentResult } from 'src/domain/assesmentResult';

export interface AssesmentResultRepository {
  create(assesResult: AssesmentResult): Promise<AssesmentResult>;
  createAssesmentResult(
    assesResults: AssesmentResult[],
  ): Promise<AssesmentResult[]>;
  findById(id: string): Promise<AssesmentResult | null>;
  findByUploadId(id: string): Promise<AssesmentResult | null>;
  findByStudentId(id: string): Promise<AssesmentResult[]>;
  findAll(): Promise<AssesmentResult[]>;
  update(
    id: string,
    patch: Partial<AssesmentResult>,
  ): Promise<AssesmentResult | null>;
  delete(id: string): Promise<boolean>;
}
