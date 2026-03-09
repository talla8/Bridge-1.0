import { Injectable } from '@nestjs/common';
import { SubjectOffering } from 'src/domain/subjectOffering';
import { SubjectOfferingRepository } from 'src/repositories/subjectOffering.repository';

@Injectable()
export class InMemorySubjectOfferingsRepo implements SubjectOfferingRepository {
  private subjectOfferings: SubjectOffering[] = [];

  async create(subjectOffering: SubjectOffering): Promise<SubjectOffering> {
    this.subjectOfferings.push(subjectOffering);
    return subjectOffering;
  }

  async findById(id: string): Promise<SubjectOffering | null> {
    return (
      this.subjectOfferings.find(
        (subjectOffering: SubjectOffering): boolean => subjectOffering.subjectOfferingId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<SubjectOffering[]> {
    return this.subjectOfferings;
  }

  async update(
    id: string,
    patch: Partial<SubjectOffering>,
  ): Promise<SubjectOffering | null> {
    const index = this.subjectOfferings.findIndex(
      (item: SubjectOffering): boolean => item.subjectOfferingId === id,
    );
    if (index === -1) return null;

    const updated: SubjectOffering = { ...this.subjectOfferings[index], ...patch };
    this.subjectOfferings[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.subjectOfferings.findIndex(
      (item: SubjectOffering): boolean => item.subjectOfferingId === id,
    );
    if (index === -1) return false;

    this.subjectOfferings.splice(index, 1);
    return true;
  }
}
