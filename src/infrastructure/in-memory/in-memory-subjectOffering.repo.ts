import { SubjectOfferingRepository } from 'src/repositories/subjectOffering.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemorySubjectOfferingsRepo implements SubjectOfferingRepository {
  private subjectOfferings: any[] = [];

  async create(subjectOffering: any): Promise<any> {
    this.subjectOfferings.push(subjectOffering);
    return subjectOffering;
  }

  async findById(id: string): Promise<any | null> {
    return this.subjectOfferings.find(function (subjectOffering: any): boolean {
      return subjectOffering.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.subjectOfferings;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.subjectOfferings.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.subjectOfferings[index];
    const updated = { ...current, ...patch };
    this.subjectOfferings[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.subjectOfferings.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.subjectOfferings.splice(index, 1);
    return true;
  }
}
