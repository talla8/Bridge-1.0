import { AssesmentResultRepository } from 'src/repositories/assesmentResult.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryAssesmentResultsRepo implements AssesmentResultRepository {
  private assesmentResults: any[] = [];

  async create(assesmentResult: any): Promise<any> {
    this.assesmentResults.push(assesmentResult);
    return assesmentResult;
  }

  async createMany(assesmentResults: any[]): Promise<any[]> {
    this.assesmentResults.push(...assesmentResults);
    return assesmentResults;
  }

  async findById(id: string): Promise<any | null> {
    return this.assesmentResults.find(function (assesmentResult: any): boolean {
      return assesmentResult.id === id;
    });
  }

    async findByUploadId(id: string): Promise<any | null> {
    return this.assesmentResults.find(function (assesmentResult: any): boolean {
      return assesmentResult.uploadId === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.assesmentResults;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.assesmentResults.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.assesmentResults[index];
    const updated = { ...current, ...patch };
    this.assesmentResults[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.assesmentResults.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.assesmentResults.splice(index, 1);
    return true;
  }
}
