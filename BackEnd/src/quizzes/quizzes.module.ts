import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StudentsModule } from 'src/students/students.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [InMemoryReposModule, StudentsModule, DatabaseModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
