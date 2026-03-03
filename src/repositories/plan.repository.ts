import { Plan } from 'src/domain/plan';

export interface PlanRepository {
  create(plan: Plan): Promise<Plan>;
  findById(id: string): Promise<Plan | null>;
  findAll(): Promise<Plan[]>;
  update(id: string, patch: Partial<Plan>): Promise<Plan | null>;
  delete(id: string): Promise<boolean>;
}
