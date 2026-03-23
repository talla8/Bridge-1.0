import { Injectable } from '@nestjs/common';
import { BaselineProcessingServiceService } from 'src/baseline/baseline-processing-service.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { Student } from 'src/domain/student';
import { StudentsService } from 'src/students/students.service';

export enum Priority {
  LOW = 'LOW',
  MID = 'MID',
  HIGH = 'HIGH',
}

@Injectable()
export class StatisticsService {
  constructor(
    private readonly baselineProcessingService: BaselineProcessingServiceService,
    private readonly studentsService: StudentsService,
  ) {}

  async classAverage(): Promise<number> {
    const results = await this.baselineProcessingService.getAllResults();
    // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    // console.log(results);
    if (results.length === 0) {
      return 0;
    }

    const studentIds = [...new Set(results.map((result) => result.studentId))];
    const studentAverages: number[] = [];

    for (const studentId of studentIds) {
      const studentResults =
        await this.baselineProcessingService.findByStudentId(studentId);
      studentAverages.push(this.calculateSkillsAvgPerStudent(studentResults));
    }

    const totalAverage = studentAverages.reduce(
      (sum, average) => sum + average,
      0,
    );

    return totalAverage / studentAverages.length;
  }

  async countSkillsAvgPerStudent(studentId: string): Promise<number> {
    const studentResults =
      await this.baselineProcessingService.findByStudentId(studentId);
    //   console.log(studentId);
    //   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    // console.log(studentResults);

    return this.calculateSkillsAvgPerStudent(studentResults);
  }

  calculateSkillsAvgPerStudent(studentResults?: AssesmentResult[]): number {
    if (!studentResults || studentResults.length === 0) {
      return 0;
    }

    const sum = studentResults.reduce(
      (sum, current) => sum + this.scoreToPercent(current),
      0,
    );

    return sum / studentResults.length;
  }

  async needHelpStudents(): Promise<Student[]> {
    const students: Student[] = await this.studentsService.findAll();
    const classSkillAverages = await this.calculateAvgForEachSkill();
    const skillAverageMap = new Map<string, number>(
      classSkillAverages.map((item: { skillId: string; avg: number }) => [
        item.skillId,
        item.avg,
      ]),
    );
    const needHelpStudents: Student[] = [];

    for (const student of students) {
      const studentResults =
        await this.baselineProcessingService.findByStudentId(student.studentId);

      const isBelowAverageInEverySkill = this.getRequiredSkillIds().every(
        (skillId) => {
          const resultForSkill = studentResults.find(
            (result) => result.skillId === skillId,
          );

          if (!resultForSkill) {
            return false;
          }

          const studentSkillPercent = this.scoreToPercent(resultForSkill);
          const classSkillAverage = skillAverageMap.get(skillId) ?? 0;

          return studentSkillPercent < classSkillAverage;
        },
      );

      if (isBelowAverageInEverySkill) {
        needHelpStudents.push(student);
      }
    }

    return needHelpStudents;
  }

  async calculateAvgForEachSkill(): Promise<any> {
    const results = await this.baselineProcessingService.getAllResults();
    const skillIds = this.getRequiredSkillIds();
    let skillsAndAverages: any[] = [];

    for (const skillId of skillIds) {
      const skillResults = results.filter((result) => result.skillId === skillId);
      const avg =
        skillResults.length === 0
          ? 0
          : skillResults.reduce((sum, result) => sum + this.scoreToPercent(result), 0) /
            skillResults.length;

      skillsAndAverages.push({ avg, skillId });
    }

    return skillsAndAverages;
  }

  private scoreToPercent(result: AssesmentResult): number {
    const maxScore = this.getMaxScore(result.skillId);
    if (maxScore === 0) {
      return 0;
    }

    return (result.totalScore / maxScore) * 100;
  }

  private getMaxScore(skillId: string): number {
    switch (skillId) {
      case 'skill_vocal':
        return 6;
      case 'skill_sounds_of_letters':
        return 8;
      case 'skill_writing':
        return 4;
      default:
        return 100;
    }
  }

  private getRequiredSkillIds(): string[] {
    return ['skill_vocal', 'skill_sounds_of_letters', 'skill_writing'];
  }

  async sortWeakestSkills() {}

  async buildSkillRows(assesmentResult: AssesmentResult[]): Promise<any> {
    //     - [ ] First we initiate the variables: name, below avg, class avg, priority
    const students = this.studentsService.findAll();
    const results = await this.baselineProcessingService.getAllResults();
    let name: string[] = [];
    let classAvgForEchSkill;
    let priority: Priority;

    // - [ ] \we initaiante an array of objects called Skillrows
    let skillRows = [];

    // - [ ] We initiate an array odyssey belowAvgStds
    let belowAvgStds: Student[] = [];

    // - [ ] we loop around the skills id
    // - [ ]  We loop around the results and extract the name
    // - [ ] We put the name into the first element  of skillrows
    const skillIds = [
      'skill_vocal',
      'skill_sounds_of_letters',
      'skill_writing',
    ];
    for (const skillId of skillIds) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].skillId === skillId) {
          name.push(results[0].skillId);
        }
      }
    }

    // - [ ] We extract the skill avg from the previous method
    const avgForEachSkill = this.calculateAvgForEachSkill();
    for (const skillId of skillIds) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].skillId === skillId) {
          // - [ ] We extract the total score from each result
          // - [ ] We turn it into a percentage
          const totalScore = results[0].totalScore;
          const percentage = (totalScore * 100) / 100;

          // - [ ] We compare with the skill avg from the previous method
          // - [ ] If below it, we push the student to the belowAvgStds array
          if (percentage < avgForEachSkill['avg']) {
            belowAvgStds.push(students[i]);
          }
        }
      }
    }

    // - [ ] When finished we assign the length of students to below avg
    const belowAvgSkillsCount: number = belowAvgStds.length;

    // - [ ] We extract class avg from the one of the previous methods
    classAvgForEchSkill = this.calculateAvgForEachSkill();
    // - [ ] We sort skills by the count of below avg students
    // - [ ] We devde the student count by three
    // - [ ] For the first third which is the min the priority is high, and for the others..
    // - [ ] Find the min skill of all
  }

  async InsightString(assesmentResult: AssesmentResult): Promise<string> {
    const results = await this.baselineProcessingService.getAllResults();
    const objects = await this.calculateAvgForEachSkill();
    let avgs: number[] = [];

    const avg = objects.find(
      (item) => item.skillId === assesmentResult.skillId,
    )?.avg;

    if (avg !== undefined) {
      avgs.push(avg);
    }

    const min = avg.min;

    return `skskkkew ${min}`;
  }
}
