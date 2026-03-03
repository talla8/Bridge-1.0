import { Injectable } from '@nestjs/common';
import { Plan } from 'src/domain/plan';
import { PlanRepository } from 'src/repositories/plan.repository';

@Injectable()
export class InMemoryPlansRepo implements PlanRepository {
  private plans: Plan[] = [];

  async create(plan: Plan): Promise<Plan> {
    this.plans.push(plan);
    return plan;
  }

  async findById(id: string): Promise<Plan | null> {
    return this.plans.find((plan: Plan): boolean => plan.planId === id) ?? null;
  }

  async findAll(): Promise<Plan[]> {
    return this.plans;
  }

  async update(id: string, patch: Partial<Plan>): Promise<Plan | null> {
    const index = this.plans.findIndex((item: Plan): boolean => item.planId === id);
    if (index === -1) return null;

    const updated: Plan = { ...this.plans[index], ...patch };
    this.plans[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.plans.findIndex((item: Plan): boolean => item.planId === id);
    if (index === -1) return false;

    this.plans.splice(index, 1);
    return true;
  }
}
