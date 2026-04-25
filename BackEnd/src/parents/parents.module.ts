import { Module } from '@nestjs/common';
import { BaselineModule } from 'src/baseline/baseline.module';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StudentsModule } from 'src/students/students.module';
import { SupportProgramsModule } from 'src/support-programs/support-programs.module';
import { UsersModule } from 'src/users/users.module';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    BaselineModule,
    SupportProgramsModule,
    InMemoryReposModule,
  ],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
