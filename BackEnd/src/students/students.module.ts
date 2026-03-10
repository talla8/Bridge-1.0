import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { UsersModule } from 'src/users/users.module';
import { BaselineModule } from 'src/baseline/baseline.module';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';

@Module({
  imports: [UsersModule, BaselineModule, InMemoryReposModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
