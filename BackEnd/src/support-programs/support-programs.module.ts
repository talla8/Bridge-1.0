import { Module } from '@nestjs/common';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { SupportProgramsController } from './support-programs.controller';
import { SupportProgramsService } from './support-programs.service';

@Module({
  imports: [InMemoryReposModule],
  controllers: [SupportProgramsController],
  providers: [SupportProgramsService],
  exports: [SupportProgramsService],
})
export class SupportProgramsModule {}
