import { SupportProgram } from 'src/domain/support-program';

export interface SupportProgramRepository {
  create(supportProgram: SupportProgram): Promise<SupportProgram>;
  createMany(supportPrograms: SupportProgram[]): Promise<SupportProgram[]>;
  findById(id: string): Promise<SupportProgram | null>;
  findAll(): Promise<SupportProgram[]>;
  update(
    id: string,
    patch: Partial<SupportProgram>,
  ): Promise<SupportProgram | null>;
  delete(id: string): Promise<boolean>;
}
