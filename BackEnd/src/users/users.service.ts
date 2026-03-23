import { Injectable } from '@nestjs/common';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';
import { User } from 'src/domain/user';
import { UserId } from 'src/domain/ids';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: InMemoryUsersRepo) {}
  async findbyEmail(username: string): Promise<User | null> {
    return this.userRepo.findByEmail(username);
  }

  async create(user: User): Promise<User | null> {
    return this.userRepo.create(user);
  }

  async findById(userId: UserId): Promise<User | null> {
    console.log(userId);
    return this.userRepo.findById(userId);
  }

  async update(userId: UserId, patch: Partial<Omit<User, 'userId'>>): Promise<User | null> {
    return this.userRepo.update(userId, patch);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.findAll();
  }
}
