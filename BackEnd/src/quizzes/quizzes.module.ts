import { Module } from '@nestjs/common';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [InMemoryReposModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
