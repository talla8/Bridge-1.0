import { PlanLogRepository } from 'src/repositories/planLog.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryPlanLogsRepo implements PlanLogRepository {
  private planLogs: any[] = [];

  async create(planLog: any): Promise<any> {
    this.planLogs.push(planLog);
    return planLog;
  }

  async findById(id: string): Promise<any | null> {
    return this.planLogs.find(function (planLog: any): boolean {
      return planLog.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.planLogs;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.planLogs.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.planLogs[index];
    const updated = { ...current, ...patch };
    this.planLogs[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.planLogs.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.planLogs.splice(index, 1);
    return true;
  }
}
