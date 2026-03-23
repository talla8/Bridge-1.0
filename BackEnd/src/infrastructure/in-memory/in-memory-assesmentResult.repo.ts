import { Injectable } from '@nestjs/common';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { AssesmentResultRepository } from 'src/repositories/assesmentResult.repository';

@Injectable()
export class InMemoryAssesmentResultsRepo implements AssesmentResultRepository {
  private assesmentResults: AssesmentResult[] = [];

  async create(assesmentResult: AssesmentResult): Promise<AssesmentResult> {
    this.assesmentResults.push(assesmentResult);
    return assesmentResult;
  }

  async createAssesmentResult(
    assesmentResults: AssesmentResult[],
  ): Promise<AssesmentResult[]> {
    this.assesmentResults.push(...assesmentResults);
    return assesmentResults;
  }

  async findById(id: string): Promise<AssesmentResult | null> {
    return (
      this.assesmentResults.find(
        (assesmentResult: AssesmentResult): boolean =>
          assesmentResult.resultId === id,
      ) ?? null
    );
  }
  async findByStudentId(id: string): Promise<AssesmentResult[]> {
        console.log("id:");
    console.log(id);
    return this.assesmentResults.filter(
      (assesmentResult: AssesmentResult): boolean =>
        assesmentResult.studentId === id,
    );
  }

  async findByUploadId(id: string): Promise<AssesmentResult | null> {
    return (
      this.assesmentResults.find(
        (assesmentResult: AssesmentResult): boolean =>
          assesmentResult.uploadId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<AssesmentResult[]> {
    return this.assesmentResults;
  }

  async update(
    id: string,
    patch: Partial<AssesmentResult>,
  ): Promise<AssesmentResult | null> {
    const index = this.assesmentResults.findIndex(
      (item: AssesmentResult): boolean => item.resultId === id,
    );
    if (index === -1) return null;

    const updated: AssesmentResult = {
      ...this.assesmentResults[index],
      ...patch,
    };
    this.assesmentResults[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.assesmentResults.findIndex(
      (item: AssesmentResult): boolean => item.resultId === id,
    );
    if (index === -1) return false;

    this.assesmentResults.splice(index, 1);
    return true;
  }
}
