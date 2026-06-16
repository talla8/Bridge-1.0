import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlanInputService } from './plan-input.service';
import { PlansService } from './plans.service';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StatisticsModule } from 'src/statistics/statistics.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [InMemoryReposModule, StatisticsModule, DatabaseModule],
  controllers: [PlansController],
  providers: [PlanInputService, PlansService],
  exports: [PlansService],
})
export class PlansModule {}
