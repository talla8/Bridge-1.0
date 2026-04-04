import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlanInputService } from './plan-input.service';
import { PlansService } from './plans.service';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { StatisticsModule } from 'src/statistics/statistics.module';

@Module({
  imports: [InMemoryReposModule, StatisticsModule],
  controllers: [PlansController],
  providers: [PlanInputService, PlansService],
})
export class PlansModule {}
