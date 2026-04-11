import { PlanItem } from 'src/domain/plan-item';

export interface PlanItemRepository {
  create(planItem: PlanItem): Promise<PlanItem>;
  findById(id: string): Promise<PlanItem | null>;
  findAll(): Promise<PlanItem[]>;
  update(id: string, patch: Partial<PlanItem>): Promise<PlanItem | null>;
  delete(id: string): Promise<boolean>;
}
