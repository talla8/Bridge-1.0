import { InstitutionNotification } from 'src/institutions/domain/institution-notification';

export interface InstitutionNotificationRepository {
  create(notification: InstitutionNotification): Promise<InstitutionNotification>;
  createMany(
    notifications: InstitutionNotification[],
  ): Promise<InstitutionNotification[]>;
  findById(id: string): Promise<InstitutionNotification | null>;
  findAll(): Promise<InstitutionNotification[]>;
  update(
    id: string,
    patch: Partial<InstitutionNotification>,
  ): Promise<InstitutionNotification | null>;
  delete(id: string): Promise<boolean>;
}
