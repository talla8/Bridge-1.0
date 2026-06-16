import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionTask } from 'src/institutions/domain/institution-task';
import { InstitutionTaskRepository } from 'src/repositories/institution-task.repository';
import { InstitutionTaskEntity } from './entities/institution-task.entity';

@Injectable()
export class SqliteInstitutionTasksRepo implements InstitutionTaskRepository {
  constructor(
    @InjectRepository(InstitutionTaskEntity)
    private readonly repository: Repository<InstitutionTaskEntity>,
  ) {}

  async create(task: InstitutionTask): Promise<InstitutionTask> {
    const entity = this.repository.create(task);
    return this.repository.save(entity);
  }

  async createMany(tasks: InstitutionTask[]): Promise<InstitutionTask[]> {
    await this.repository.clear();
    const entities = this.repository.create(tasks);
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<InstitutionTask | null> {
    return this.repository.findOneBy({ taskId: id });
  }

  async findAll(): Promise<InstitutionTask[]> {
    return this.repository.find();
  }

  async update(
    id: string,
    patch: Partial<InstitutionTask>,
  ): Promise<InstitutionTask | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = this.repository.merge(
      this.repository.create(existing),
      patch as Partial<InstitutionTaskEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ taskId: id });
    return Boolean(result.affected);
  }
}
