import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import type { StudentId, SubjectId } from 'src/domain/ids';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  assesmentResulttest: AssesmentResult[] = [];
  @Get('class')
  getClassavg(@Req() req, @Query('subjectId') subjectId?: SubjectId) {
    return this.statisticsService.classAverage(req.user.sub, subjectId);
  }
  @Get('avgPerSTD/:studentId')
  getAvgPerSTD(
    @Param('studentId') studentId: StudentId,
    @Query('subjectId') subjectId?: SubjectId,
  ) {
    return this.statisticsService.countSkillsAvgPerStudent(studentId, subjectId);
  }

  @Get('needHelp')
  NeedHelpSTDS() {
    return this.statisticsService.needHelpStudents();
  }

  @Get('weak-students')
  getWeakStudents(@Req() req, @Query('subjectId') subjectId?: SubjectId) {
    return this.statisticsService.getWeakStudentsForTeacher(
      req.user.sub,
      subjectId,
    );
  }

  @Get('avgskill')
  calculateAvgForEachSkill(@Query('subjectId') subjectId?: SubjectId) {
    return this.statisticsService.calculateAvgForEachSkill(undefined, subjectId);
  }

  @Get('class/skills')
  getClassSkillAverages(@Req() req, @Query('subjectId') subjectId?: SubjectId) {
    return this.statisticsService.sortWeakestSkills(req.user.sub, subjectId);
  }

  @Get('class/recommendation')
  getClassRecommendation(@Req() req, @Query('subjectId') subjectId?: SubjectId) {
    return this.statisticsService.getClassActionRecommendation(
      req.user.sub,
      subjectId,
    );
  }
}
