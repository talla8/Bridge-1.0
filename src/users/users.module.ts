import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';

@Module({
  controllers: [UsersController],
  providers: [UsersService, InMemoryUsersRepo],
})
export class UsersModule {}
