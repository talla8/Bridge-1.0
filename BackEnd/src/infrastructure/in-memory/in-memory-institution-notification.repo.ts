import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { InstitutionNotification } from 'src/institutions/domain/institution-notification';
import { InstitutionNotificationRepository } from 'src/repositories/institution-notification.repository';

@Injectable()
export class InMemoryInstitutionNotificationsRepo
  implements InstitutionNotificationRepository
{
  private notifications: InstitutionNotification[] = [];
  private readonly filePath = resolve(
    __dirname,
    '../../mock-data/institution_notifications.json',
  );

  async create(
    notification: InstitutionNotification,
  ): Promise<InstitutionNotification> {
    this.notifications.push(notification);
    await this.persist();
    return notification;
  }

  async createMany(
    notifications: InstitutionNotification[],
  ): Promise<InstitutionNotification[]> {
    this.notifications = notifications.map((item) => ({ ...item }));
    await this.persist();
    return this.notifications;
  }

  async findById(id: string): Promise<InstitutionNotification | null> {
    return (
      this.notifications.find(
        (item) => String(item.notificationId) === String(id),
      ) ?? null
    );
  }

  async findAll(): Promise<InstitutionNotification[]> {
    return this.notifications;
  }

  async update(
    id: string,
    patch: Partial<InstitutionNotification>,
  ): Promise<InstitutionNotification | null> {
    const index = this.notifications.findIndex(
      (item) => String(item.notificationId) === String(id),
    );
    if (index === -1) return null;

    const updated: InstitutionNotification = {
      ...this.notifications[index],
      ...patch,
    };
    this.notifications[index] = updated;
    await this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.notifications.findIndex(
      (item) => String(item.notificationId) === String(id),
    );
    if (index === -1) return false;

    this.notifications.splice(index, 1);
    await this.persist();
    return true;
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      JSON.stringify(
        this.notifications.map((item) => this.serialize(item)),
        null,
        2,
      ),
      'utf-8',
    );
  }

  private serialize(notification: InstitutionNotification) {
    return {
      NotificationId: notification.notificationId,
      SchoolId: notification.schoolId,
      CreatedByUserId: notification.createdByUserId,
      Title: notification.title,
      Message: notification.message,
      RecipientTeacherUserIds: notification.recipientTeacherUserIds ?? [],
      SenderRole: notification.senderRole,
      Attachments: notification.attachments ?? [],
      CreatedAt: notification.createdAt?.toISOString?.() ?? notification.createdAt,
    };
  }
}
