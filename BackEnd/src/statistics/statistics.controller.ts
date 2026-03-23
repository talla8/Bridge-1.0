import { Body, Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import type { StudentId } from 'src/domain/ids';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  assesmentResulttest: AssesmentResult[] = [];
  @Get('class')
  getClassavg() {
    return this.statisticsService.classAverage();
  }
  @Get('avgPerSTD/:studentId')
  getAvgPerSTD(@Param('studentId') studentId: StudentId) {
    return this.statisticsService.countSkillsAvgPerStudent(studentId);
  }

  @Get('needHelp')
  NeedHelpSTDS() {
    return this.statisticsService.needHelpStudents();
  }

  @Get('avgskill')
  calculateAvgForEachSkill() {
    return this.statisticsService.calculateAvgForEachSkill();
  }
}
