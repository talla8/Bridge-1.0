import { PlanRepository } from 'src/repositories/plan.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryPlansRepo implements PlanRepository {
  private plans: any[] = [];

  async create(plan: any): Promise<any> {
    this.plans.push(plan);
    return plan;
  }

  async findById(id: string): Promise<any | null> {
    return this.plans.find(function (plan: any): boolean {
      return plan.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.plans;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.plans.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.plans[index];
    const updated = { ...current, ...patch };
    this.plans[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.plans.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.plans.splice(index, 1);
    return true;
  }
}
