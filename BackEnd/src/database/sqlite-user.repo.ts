import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/domain/user';
import { UserRepository } from 'src/repositories/user.repository';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class SqliteUsersRepo implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(user: User): Promise<User> {
    const entity = this.repository.create(this.normalizeUser(user));
    return this.repository.save(entity);
  }

  async createMany(users: User[]): Promise<User[]> {
    const savedUsers: User[] = [];

    for (const user of users) {
      const normalizedUser = this.normalizeUser(user);
      const existing = await this.findById(normalizedUser.userId);
      if (existing) {
        const merged = this.repository.merge(
          this.repository.create(existing),
          normalizedUser as Partial<UserEntity>,
        );
        savedUsers.push(await this.repository.save(merged));
        continue;
      }

      const entity = this.repository.create(normalizedUser);
      savedUsers.push(await this.repository.save(entity));
    }

    return savedUsers;
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ userId: String(id) });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.save(
      this.repository.merge(this.repository.create(existing), { isActive: false }),
    );
    return true;
  }

  async findAll(filters?: {
    role?: string;
    isActive?: boolean | string;
    search?: string;
  }): Promise<User[]> {
    const users = await this.repository.find();
    if (!filters) return users;

    const role = filters.role?.toLowerCase();
    const search = filters.search?.toLowerCase();
    const isActive =
      typeof filters.isActive === 'string'
        ? filters.isActive.toLowerCase() === 'true'
        : filters.isActive;

    return users.filter((user) => {
      const roleOk = role ? String(user.roleId ?? '').toLowerCase() === role : true;
      const activeOk =
        isActive !== undefined ? Boolean(user.isActive) === Boolean(isActive) : true;
      const searchOk = search
        ? user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        : true;

      return roleOk && activeOk && searchOk;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const users = await this.repository.find();
    return (
      users.find(
        (user) => String(user.email ?? '').trim().toLowerCase() === normalizedEmail,
      ) ?? null
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    return Boolean(await this.findByEmail(email));
  }

  async update(
    id: string,
    patch: Partial<Omit<User, 'id' | 'CreatedAt'>>,
  ): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const normalizedPatch = this.normalizeUserPatch(patch);
    const merged = this.repository.merge(
      this.repository.create(existing),
      normalizedPatch as Partial<UserEntity>,
    );
    return this.repository.save(merged);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.existsBy({ userId: String(id) });
  }

  private normalizeUser(user: User): User {
    return {
      ...user,
      userId: String(user.userId),
      schoolId:
        user.schoolId === undefined || user.schoolId === null
          ? undefined
          : String(user.schoolId),
      email: String(user.email ?? '').trim(),
    };
  }

  private normalizeUserPatch(
    patch: Partial<Omit<User, 'id' | 'CreatedAt'>>,
  ): Partial<User> {
    return {
      ...patch,
      schoolId:
        patch.schoolId === undefined || patch.schoolId === null
          ? patch.schoolId
          : String(patch.schoolId),
      email:
        patch.email === undefined ? patch.email : String(patch.email).trim(),
    };
  }
}
