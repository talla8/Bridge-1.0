import { Controller, Get, Param, Req } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import type { StudentId } from 'src/domain/ids';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  assesmentResulttest: AssesmentResult[] = [];
  @Get('class')
  getClassavg(@Req() req) {
    return this.statisticsService.classAverage(req.user.sub);
  }
  @Get('avgPerSTD/:studentId')
  getAvgPerSTD(@Param('studentId') studentId: StudentId) {
    return this.statisticsService.countSkillsAvgPerStudent(studentId);
  }

  @Get('needHelp')
  NeedHelpSTDS() {
    return this.statisticsService.needHelpStudents();
  }

  @Get('weak-students')
  getWeakStudents(@Req() req) {
    return this.statisticsService.getWeakStudentsForTeacher(req.user.sub);
  }

  @Get('avgskill')
  calculateAvgForEachSkill() {
    return this.statisticsService.calculateAvgForEachSkill();
  }

  @Get('class/skills')
  getClassSkillAverages(@Req() req) {
    return this.statisticsService.sortWeakestSkills(req.user.sub);
  }

  @Get('class/recommendation')
  getClassRecommendation(@Req() req) {
    return this.statisticsService.getClassActionRecommendation(req.user.sub);
  }
}
