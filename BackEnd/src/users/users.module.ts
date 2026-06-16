import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [InMemoryReposModule, DatabaseModule],
})
export class UsersModule {}
