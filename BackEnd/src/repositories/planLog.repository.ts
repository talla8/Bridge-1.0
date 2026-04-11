import { PlanLog } from 'src/domain/planLog';

export interface PlanLogRepository {
  create(planLog: PlanLog): Promise<PlanLog>;
  findById(id: string): Promise<PlanLog | null>;
  findAll(): Promise<PlanLog[]>;
  findByPlanId(planId: string): Promise<PlanLog[]>;
  update(id: string, patch: Partial<PlanLog>): Promise<PlanLog | null>;
  delete(id: string): Promise<boolean>;
}
