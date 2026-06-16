import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { InstitutionTask } from 'src/institutions/domain/institution-task';
import { InstitutionTaskRepository } from 'src/repositories/institution-task.repository';

@Injectable()
export class InMemoryInstitutionTasksRepo implements InstitutionTaskRepository {
  private tasks: InstitutionTask[] = [];
  private readonly filePath = resolve(
    __dirname,
    '../../mock-data/institution_tasks.json',
  );

  async create(task: InstitutionTask): Promise<InstitutionTask> {
    this.tasks.push(task);
    await this.persist();
    return task;
  }

  async createMany(tasks: InstitutionTask[]): Promise<InstitutionTask[]> {
    this.tasks = tasks.map((item) => ({ ...item }));
    await this.persist();
    return this.tasks;
  }

  async findById(id: string): Promise<InstitutionTask | null> {
    return this.tasks.find((item) => String(item.taskId) === String(id)) ?? null;
  }

  async findAll(): Promise<InstitutionTask[]> {
    return this.tasks;
  }

  async update(
    id: string,
    patch: Partial<InstitutionTask>,
  ): Promise<InstitutionTask | null> {
    const index = this.tasks.findIndex(
      (item) => String(item.taskId) === String(id),
    );
    if (index === -1) return null;

    const updated: InstitutionTask = { ...this.tasks[index], ...patch };
    this.tasks[index] = updated;
    await this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.tasks.findIndex(
      (item) => String(item.taskId) === String(id),
    );
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    await this.persist();
    return true;
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      JSON.stringify(this.tasks.map((item) => this.serialize(item)), null, 2),
      'utf-8',
    );
  }

  private serialize(task: InstitutionTask) {
    return {
      TaskId: task.taskId,
      SchoolId: task.schoolId,
      CreatedByUserId: task.createdByUserId,
      Title: task.title,
      Description: task.description ?? null,
      AssignedTeacherUserIds: task.assignedTeacherUserIds ?? [],
      Attachments: task.attachments ?? [],
      DueDate: task.dueDate?.toISOString?.() ?? task.dueDate ?? null,
      Status: task.status,
      IsHidden: task.isHidden ?? false,
      Submissions: (task.submissions ?? []).map((submission) => ({
        TeacherUserId: submission.teacherUserId,
        SubmittedAt:
          submission.submittedAt?.toISOString?.() ?? submission.submittedAt,
        Message: submission.message ?? null,
        Attachments: submission.attachments ?? [],
      })),
      CreatedAt: task.createdAt?.toISOString?.() ?? task.createdAt,
    };
  }
}
