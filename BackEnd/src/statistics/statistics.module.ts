import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { BaselineModule } from 'src/baseline/baseline.module';
import { StudentsModule } from 'src/students/students.module';

@Module({
  imports: [BaselineModule, StudentsModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
