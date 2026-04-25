import { Injectable } from '@nestjs/common';
import { BaselineProcessingServiceService } from 'src/baseline/baseline-processing-service.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { SkillId, StudentId, UserId } from 'src/domain/ids';
import { Student } from 'src/domain/student';
import { InMemorySkillsRepo } from 'src/infrastructure/in-memory/in-memory-skill.repo';
import { StudentsService } from 'src/students/students.service';

export enum Priority {
  LOW = 'LOW',
  MID = 'MID',
  HIGH = 'HIGH',
}

export interface SkillPriorityRow {
  skillId: string;
  avg: number;
  priority: Priority;
}

export type WeakStudentSummary = {
  studentId: StudentId;
  fullArabicName: string;
  fullEnglishName: string;
  overallAverage: number;
  weakSkills: {
    skillId: SkillId;
    skillName: string;
    studentScore: number;
    classAverage: number;
    gap: number;
  }[];
  initialScores: {
    skillId: SkillId;
    skillName: string;
    score: number;
  }[];
};

@Injectable()
export class StatisticsService {
  constructor(
    private readonly baselineProcessingService: BaselineProcessingServiceService,
    private readonly studentsService: StudentsService,
    private readonly skillsRepo: InMemorySkillsRepo,
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

  async getWeakStudentsForTeacher(
    teacherId: UserId,
  ): Promise<WeakStudentSummary[]> {
    const students = await this.studentsService.getStudents(teacherId);
    const studentIds = new Set(students.map((student) => student.studentId));
    const results = (
      await this.baselineProcessingService.getAllResults()
    ).filter((result) => studentIds.has(result.studentId));
    const classSkillAverages = this.calculateSkillAveragesFromResults(results);
    const skillAverageMap = new Map(
      classSkillAverages.map((item) => [item.skillId, item.avg]),
    );
    const skills = await this.skillsRepo.findAll();
    const skillNameMap = new Map(
      skills.map((skill) => [skill.skillId, skill.title]),
    );

    return students.flatMap((student) => {
      const studentResults = results.filter(
        (result) => result.studentId === student.studentId,
      );
      const initialScores = this.getRequiredSkillIds().flatMap((skillId) => {
        const result = studentResults.find((item) => item.skillId === skillId);
        if (!result) return [];

        return {
          skillId,
          skillName: this.getSkillName(skillId, skillNameMap),
          score: this.scoreToPercent(result),
        };
      });
      const weakSkills = this.getRequiredSkillIds().flatMap((skillId) => {
        const result = studentResults.find((item) => item.skillId === skillId);
        if (!result) return [];

        const studentScore = this.scoreToPercent(result);
        const classAverage = skillAverageMap.get(skillId) ?? 0;
        if (studentScore >= classAverage) return [];

        return {
          skillId,
          skillName: this.getSkillName(skillId, skillNameMap),
          studentScore,
          classAverage,
          gap: classAverage - studentScore,
        };
      });

      if (weakSkills.length !== this.getRequiredSkillIds().length) {
        return [];
      }

      return {
        studentId: student.studentId,
        fullArabicName: student.fullArabicName,
        fullEnglishName: student.fullEnglishName,
        overallAverage: this.calculateSkillsAvgPerStudent(studentResults),
        weakSkills,
        initialScores,
      };
    });
  }

  async calculateAvgForEachSkill(): Promise<any> {
    const results = await this.baselineProcessingService.getAllResults();
    return this.calculateSkillAveragesFromResults(results);
  }

  private calculateSkillAveragesFromResults(
    results: AssesmentResult[],
  ): { avg: number; skillId: SkillId }[] {
    return this.getRequiredSkillIds().map((skillId) => {
      const skillResults = results.filter(
        (result) => result.skillId === skillId,
      );
      const avg =
        skillResults.length === 0
          ? 0
          : skillResults.reduce(
              (sum, result) => sum + this.scoreToPercent(result),
              0,
            ) / skillResults.length;

      return { avg, skillId };
    });
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

  private getRequiredSkillIds(): SkillId[] {
    return ['skill_vocal', 'skill_sounds_of_letters', 'skill_writing'];
  }

  private getSkillName(
    skillId: SkillId,
    skillNameMap: Map<SkillId, string>,
  ): string {
    return skillNameMap.get(skillId) ?? skillId;
  }

  async sortWeakestSkills(): Promise<SkillPriorityRow[]> {
    const skillsAndAverages = await this.calculateAvgForEachSkill();

    return skillsAndAverages
      .map(
        (item: { skillId: string; avg: number }): SkillPriorityRow => ({
          skillId: item.skillId,
          avg: item.avg,
          priority: this.getPriorityFromAverage(item.avg),
        }),
      )
      .sort((a, b) => a.avg - b.avg);
  }

  private getPriorityFromAverage(avg: number): Priority {
    if (avg < 40) {
      return Priority.HIGH;
    }

    if (avg > 70) {
      return Priority.LOW;
    }

    return Priority.MID;
  }
}
