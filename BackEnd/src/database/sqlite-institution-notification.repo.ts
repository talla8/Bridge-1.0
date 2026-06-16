import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionNotification } from 'src/institutions/domain/institution-notification';
import { InstitutionNotificationRepository } from 'src/repositories/institution-notification.repository';
import { InstitutionNotificationEntity } from './entities/institution-notification.entity';

@Injectable()
export class SqliteInstitutionNotificationsRepo
  implements InstitutionNotificationRepository
{
  constructor(
    @InjectRepository(InstitutionNotificationEntity)
    private readonly repository: Repository<InstitutionNotificationEntity>,
  ) {}

  async create(
    notification: InstitutionNotification,
  ): Promise<InstitutionNotification> {
    const entity = this.repository.create(notification);
    return this.repository.save(entity);
  }

  async createMany(
    notifications: InstitutionNotification[],
  ): Promise<InstitutionNotification[]> {
    await this.repository.clear();
    const entities = this.repository.create(notifications);
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<InstitutionNotification | null> {
    return this.repository.findOneBy({ notificationId: id });
  }

  async findAll(): Promise<InstitutionNotification[]> {
    return this.repository.find();
  }

  async update(
    id: string,
    patch: Partial<InstitutionNotification>,
  ): Promise<InstitutionNotification | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = this.repository.merge(
      this.repository.create(existing),
      patch as Partial<InstitutionNotificationEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ notificationId: id });
    return Boolean(result.affected);
  }
}
