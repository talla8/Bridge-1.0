import { InstitutionTask } from 'src/institutions/domain/institution-task';

export interface InstitutionTaskRepository {
  create(task: InstitutionTask): Promise<InstitutionTask>;
  createMany(tasks: InstitutionTask[]): Promise<InstitutionTask[]>;
  findById(id: string): Promise<InstitutionTask | null>;
  findAll(): Promise<InstitutionTask[]>;
  update(id: string, patch: Partial<InstitutionTask>): Promise<InstitutionTask | null>;
  delete(id: string): Promise<boolean>;
}
