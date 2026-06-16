import { Injectable } from '@nestjs/common';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';
import { User } from 'src/domain/user';
import { UserId } from 'src/domain/ids';
import { SqliteUsersRepo } from 'src/database/sqlite-user.repo';

@Injectable()
export class UsersService {
  constructor(
    private readonly inMemoryUserRepo: InMemoryUsersRepo,
    private readonly sqliteUsersRepo: SqliteUsersRepo,
  ) {}

  async findbyEmail(username: string): Promise<User | null> {
    const user =
      (await this.sqliteUsersRepo.findByEmail(username)) ??
      (await this.inMemoryUserRepo.findByEmail(username));
    if (!user) return null;

    if (!(await this.inMemoryUserRepo.findById(user.userId))) {
      await this.inMemoryUserRepo.create(user);
    }

    return user;
  }

  async create(user: User): Promise<User | null> {
    const savedUser = await this.sqliteUsersRepo.create(user);
    await this.inMemoryUserRepo.create(savedUser);
    return savedUser;
  }

  async findById(userId: UserId): Promise<User | null> {
    const user =
      (await this.sqliteUsersRepo.findById(userId)) ??
      (await this.inMemoryUserRepo.findById(userId));
    if (!user) return null;

    if (!(await this.inMemoryUserRepo.findById(user.userId))) {
      await this.inMemoryUserRepo.create(user);
    }

    return user;
  }

  async update(userId: UserId, patch: Partial<Omit<User, 'userId'>>): Promise<User | null> {
    const updatedUser = await this.sqliteUsersRepo.update(userId, patch);
    if (!updatedUser) return null;

    const inMemoryExisting = await this.inMemoryUserRepo.findById(userId);
    if (inMemoryExisting) {
      await this.inMemoryUserRepo.update(userId, patch);
    } else {
      await this.inMemoryUserRepo.create(updatedUser);
    }

    return updatedUser;
  }

  async findAll(): Promise<User[]> {
    const users = await this.sqliteUsersRepo.findAll();

    for (const user of users) {
      if (!(await this.inMemoryUserRepo.findById(user.userId))) {
        await this.inMemoryUserRepo.create(user);
      }
    }

    return users;
  }
}
