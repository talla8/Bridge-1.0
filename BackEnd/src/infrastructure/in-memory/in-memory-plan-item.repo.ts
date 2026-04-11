import { Injectable } from '@nestjs/common';
import { PlanItem } from 'src/domain/plan-item';
import { PlanItemRepository } from 'src/repositories/plan-item.repository';

@Injectable()
export class InMemoryPlanItemsRepo implements PlanItemRepository {
  private planItems: PlanItem[] = [];

  private findIndex(id: string): number {
    return this.planItems.findIndex(
      (planItem: PlanItem): boolean => planItem.planItemId === id,
    );
  }

  async create(planItem: PlanItem): Promise<PlanItem> {
    this.planItems.push(planItem);
    return planItem;
  }

  async findById(id: string): Promise<PlanItem | null> {
    return (
      this.planItems.find(
        (planItem: PlanItem): boolean => planItem.planItemId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<PlanItem[]> {
    return this.planItems;
  }

  async update(id: string, patch: Partial<PlanItem>): Promise<PlanItem | null> {
    const index = this.findIndex(id);
    if (index === -1) return null;

    const updated: PlanItem = { ...this.planItems[index], ...patch };
    this.planItems[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.findIndex(id);
    if (index === -1) return false;

    this.planItems.splice(index, 1);
    return true;
  }
}
