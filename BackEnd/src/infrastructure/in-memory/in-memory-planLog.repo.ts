import { Injectable } from '@nestjs/common';
import { PlanLog } from 'src/domain/planLog';
import { PlanLogRepository } from 'src/repositories/planLog.repository';

@Injectable()
export class InMemoryPlanLogsRepo implements PlanLogRepository {
  private planLogs: PlanLog[] = [];

  async create(planLog: PlanLog): Promise<PlanLog> {
    this.planLogs.push(planLog);
    return planLog;
  }

  async findById(id: string): Promise<PlanLog | null> {
    return (
      this.planLogs.find(
        (planLog: PlanLog): boolean => planLog.sessionId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<PlanLog[]> {
    return this.planLogs;
  }

  async update(id: string, patch: Partial<PlanLog>): Promise<PlanLog | null> {
    const index = this.planLogs.findIndex(
      (item: PlanLog): boolean => item.sessionId === id,
    );
    if (index === -1) return null;

    const updated: PlanLog = { ...this.planLogs[index], ...patch };
    this.planLogs[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.planLogs.findIndex(
      (item: PlanLog): boolean => item.sessionId === id,
    );
    if (index === -1) return false;

    this.planLogs.splice(index, 1);
    return true;
  }
}
