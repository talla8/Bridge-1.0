import { Injectable } from '@nestjs/common';
import { SupportProgram } from 'src/domain/support-program';
import { SupportProgramRepository } from 'src/repositories/support-program.repository';

@Injectable()
export class InMemorySupportProgramsRepo implements SupportProgramRepository {
  private supportPrograms: SupportProgram[] = [];

  async create(supportProgram: SupportProgram): Promise<SupportProgram> {
    this.supportPrograms.push(supportProgram);
    return supportProgram;
  }

  async createMany(
    supportPrograms: SupportProgram[],
  ): Promise<SupportProgram[]> {
    this.supportPrograms.push(...supportPrograms);
    return supportPrograms;
  }

  async findById(id: string): Promise<SupportProgram | null> {
    return (
      this.supportPrograms.find(
        (supportProgram) => supportProgram.supportProgramId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<SupportProgram[]> {
    return this.supportPrograms;
  }

  async update(
    id: string,
    patch: Partial<SupportProgram>,
  ): Promise<SupportProgram | null> {
    const index = this.supportPrograms.findIndex(
      (supportProgram) => supportProgram.supportProgramId === id,
    );
    if (index === -1) return null;

    const updated: SupportProgram = {
      ...this.supportPrograms[index],
      ...patch,
    };
    this.supportPrograms[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.supportPrograms.findIndex(
      (supportProgram) => supportProgram.supportProgramId === id,
    );
    if (index === -1) return false;

    this.supportPrograms.splice(index, 1);
    return true;
  }
}
