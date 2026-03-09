import { Injectable } from '@nestjs/common';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';
import { User } from 'src/domain/user';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: InMemoryUsersRepo) {}
async findbyEmail(username: string) : Promise<User | null> {

    return this.userRepo.findByEmail(username);
}

async create (user:User) :Promise<User | null> {
  return this.userRepo.create(user);
}

}
