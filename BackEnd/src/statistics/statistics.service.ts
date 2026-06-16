import { Injectable } from '@nestjs/common';
import {
  AssignmentSourceType,
  AssignmentStatus,
  AssignmentTargetType,
  AssignmentType,
} from 'src/domain/assignment';
import { BaselineProcessingServiceService } from 'src/baseline/baseline-processing-service.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { SkillId, StudentId, SubjectId, UserId } from 'src/domain/ids';
import {
  DEFAULT_SUBJECT_ID,
  getSubjectSkillDefinitions,
} from 'src/domain/subject-skill-config';
import { Student } from 'src/domain/student';
import { SqliteAssignmentsRepo } from 'src/database/sqlite-assignment.repo';
import { SqliteQuizzesRepo } from 'src/database/sqlite-quiz.repo';
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

export type ClassActionRecommendation = {
  focusSkillId: SkillId | null;
  focusSkillName: string | null;
  classAveragePct: number;
  affectedClassPct: number;
  affectedStudentCount: number;
  totalStudents: number;
  weakStudentCount: number;
  recentQuizAssigned: boolean;
  daysSinceLastQuizForSkill: number | null;
  recommendationType:
    | 'CLASS_QUIZ'
    | 'SUPPORT_GROUP_QUIZ'
    | 'GUIDED_PRACTICE'
    | 'NONE';
  targetType: AssignmentTargetType | null;
  reason: string;
  actionLabel: string;
};

@Injectable()
export class StatisticsService {
  constructor(
    private readonly baselineProcessingService: BaselineProcessingServiceService,
    private readonly studentsService: StudentsService,
    private readonly skillsRepo: InMemorySkillsRepo,
    private readonly assignmentsRepo: SqliteAssignmentsRepo,
    private readonly quizzesRepo: SqliteQuizzesRepo,
  ) {}

  async classAverage(
    teacherId?: UserId,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<number> {
    const results = await this.getResultsForTeacher(teacherId, subjectId);
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
      studentAverages.push(
        this.calculateSkillsAvgPerStudent(studentResults, subjectId),
      );
    }

    const totalAverage = studentAverages.reduce(
      (sum, average) => sum + average,
      0,
    );

    return totalAverage / studentAverages.length;
  }
  async countSkillsAvgPerStudent(
    studentId: string,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<number> {
    const studentResults =
      await this.baselineProcessingService.findByStudentId(studentId);
    //   console.log(studentId);
    //   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    // console.log(studentResults);

    return this.calculateSkillsAvgPerStudent(studentResults, subjectId);
  }

  calculateSkillsAvgPerStudent(
    studentResults?: AssesmentResult[],
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): number {
    const relevantResults = this.filterResultsBySubject(
      studentResults ?? [],
      subjectId,
    );

    if (relevantResults.length === 0) {
      return 0;
    }

    const sum = relevantResults.reduce(
      (sum, current) => sum + this.scoreToPercent(current),
      0,
    );

    return sum / relevantResults.length;
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
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<WeakStudentSummary[]> {
    const students = await this.studentsService.getStudents(teacherId);
    const studentIds = new Set(students.map((student) => student.studentId));
    const results = (
      await this.baselineProcessingService.getAllResults()
    ).filter((result) => studentIds.has(result.studentId));
    const filteredResults = this.filterResultsBySubject(results, subjectId);
    const classSkillAverages = this.calculateSkillAveragesFromResults(
      filteredResults,
      subjectId,
    );
    const skillAverageMap = new Map(
      classSkillAverages.map((item) => [item.skillId, item.avg]),
    );
    const skills = await this.skillsRepo.findAll();
    const skillNameMap = new Map(
      skills.map((skill) => [skill.skillId, skill.title]),
    );

    return students.flatMap((student) => {
      const studentResults = filteredResults.filter(
        (result) => result.studentId === student.studentId,
      );
      const initialScores = this.getRequiredSkillIds(subjectId).flatMap((skillId) => {
        const result = studentResults.find((item) => item.skillId === skillId);
        if (!result) return [];

        return {
          skillId,
          skillName: this.getSkillName(skillId, skillNameMap),
          score: this.scoreToPercent(result),
        };
      });
      const weakSkills = this.getRequiredSkillIds(subjectId).flatMap((skillId) => {
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

      if (weakSkills.length !== this.getRequiredSkillIds(subjectId).length) {
        return [];
      }

      return {
        studentId: student.studentId,
        fullArabicName: student.fullArabicName,
        fullEnglishName: student.fullEnglishName,
        overallAverage: this.calculateSkillsAvgPerStudent(
          studentResults,
          subjectId,
        ),
        weakSkills,
        initialScores,
      };
    });
  }

  async calculateAvgForEachSkill(
    teacherId?: UserId,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<any> {
    const results = await this.getResultsForTeacher(teacherId, subjectId);
    return this.calculateSkillAveragesFromResults(results, subjectId);
  }

  private calculateSkillAveragesFromResults(
    results: AssesmentResult[],
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): { avg: number; skillId: SkillId }[] {
    const filteredResults = this.filterResultsBySubject(results, subjectId);

    return this.getRequiredSkillIds(subjectId).map((skillId) => {
      const skillResults = filteredResults.filter(
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
    const definition = [
      ...getSubjectSkillDefinitions('1'),
      ...getSubjectSkillDefinitions('2'),
    ].find((item) => item.skillId === skillId);
    return definition?.maxScore ?? 100;
  }

  private getRequiredSkillIds(
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): SkillId[] {
    return getSubjectSkillDefinitions(subjectId).map(
      (definition) => definition.skillId,
    );
  }

  private getSkillName(
    skillId: SkillId,
    skillNameMap: Map<SkillId, string>,
  ): string {
    return skillNameMap.get(skillId) ?? skillId;
  }

  async sortWeakestSkills(
    teacherId?: UserId,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<SkillPriorityRow[]> {
    const skillsAndAverages = await this.calculateAvgForEachSkill(
      teacherId,
      subjectId,
    );

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

  async getClassActionRecommendation(
    teacherId: UserId,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<ClassActionRecommendation> {
    const [students, weakStudents, skillRows] = await Promise.all([
      this.studentsService.getStudents(teacherId),
      this.getWeakStudentsForTeacher(teacherId, subjectId),
      this.sortWeakestSkills(teacherId, subjectId),
    ]);

    const totalStudents = students.length;
    const weakStudentCount = weakStudents.length;
    const focusSkill = skillRows[0];

    if (!focusSkill || totalStudents === 0) {
      return {
        focusSkillId: null,
        focusSkillName: null,
        classAveragePct: 0,
        affectedClassPct: 0,
        affectedStudentCount: 0,
        totalStudents,
        weakStudentCount,
        recentQuizAssigned: false,
        daysSinceLastQuizForSkill: null,
        recommendationType: 'NONE',
        targetType: null,
        reason: 'No class assessment data is available yet for this teacher.',
        actionLabel: 'No immediate action',
      };
    }

    const focusSkillName = this.getSkillName(
      focusSkill.skillId,
      new Map([[focusSkill.skillId, this.getSkillLabel(focusSkill.skillId)]]),
    );
    const affectedStudentCount = weakStudents.filter((student) =>
      (student.weakSkills || []).some((skill) => skill.skillId === focusSkill.skillId),
    ).length;
    const affectedClassPct =
      totalStudents === 0 ? 0 : Math.round((affectedStudentCount / totalStudents) * 100);
    const recentQuizSignal = await this.getRecentQuizSignal(
      teacherId,
      focusSkill.skillId,
      focusSkillName,
    );

    if (affectedStudentCount === 0) {
      return {
        focusSkillId: focusSkill.skillId,
        focusSkillName,
        classAveragePct: Math.round(focusSkill.avg),
        affectedClassPct,
        affectedStudentCount,
        totalStudents,
        weakStudentCount,
        recentQuizAssigned: recentQuizSignal.recentQuizAssigned,
        daysSinceLastQuizForSkill: recentQuizSignal.daysSinceLastQuizForSkill,
        recommendationType: 'NONE',
        targetType: null,
        reason: `${focusSkillName} is currently the weakest class skill, but no students are below the class average in it right now.`,
        actionLabel: 'No immediate action',
      };
    }

    if (Math.round(focusSkill.avg) <= 45) {
      return {
        focusSkillId: focusSkill.skillId,
        focusSkillName,
        classAveragePct: Math.round(focusSkill.avg),
        affectedClassPct,
        affectedStudentCount,
        totalStudents,
        weakStudentCount,
        recentQuizAssigned: recentQuizSignal.recentQuizAssigned,
        daysSinceLastQuizForSkill: recentQuizSignal.daysSinceLastQuizForSkill,
        recommendationType: 'GUIDED_PRACTICE',
        targetType: null,
        reason: `${focusSkillName} is still too weak across the class for a useful quiz. Build understanding with guided practice first.`,
        actionLabel: `Start guided practice for ${focusSkillName}`,
      };
    }

    if (recentQuizSignal.recentQuizAssigned) {
      return {
        focusSkillId: focusSkill.skillId,
        focusSkillName,
        classAveragePct: Math.round(focusSkill.avg),
        affectedClassPct,
        affectedStudentCount,
        totalStudents,
        weakStudentCount,
        recentQuizAssigned: true,
        daysSinceLastQuizForSkill: recentQuizSignal.daysSinceLastQuizForSkill,
        recommendationType: 'NONE',
        targetType: null,
        reason: `A recent ${focusSkillName} quiz was already assigned. Review student responses before assigning another one.`,
        actionLabel: 'No immediate action',
      };
    }

    if (affectedClassPct >= 40) {
      return {
        focusSkillId: focusSkill.skillId,
        focusSkillName,
        classAveragePct: Math.round(focusSkill.avg),
        affectedClassPct,
        affectedStudentCount,
        totalStudents,
        weakStudentCount,
        recentQuizAssigned: false,
        daysSinceLastQuizForSkill: recentQuizSignal.daysSinceLastQuizForSkill,
        recommendationType: 'CLASS_QUIZ',
        targetType: AssignmentTargetType.WHOLE_CLASS,
        reason: `${affectedClassPct}% of the class is below average in ${focusSkillName}. A class-wide quiz will confirm whether the gap is still broad.`,
        actionLabel: `Assign class quiz for ${focusSkillName}`,
      };
    }

    return {
      focusSkillId: focusSkill.skillId,
      focusSkillName,
      classAveragePct: Math.round(focusSkill.avg),
      affectedClassPct,
      affectedStudentCount,
      totalStudents,
      weakStudentCount,
      recentQuizAssigned: false,
      daysSinceLastQuizForSkill: recentQuizSignal.daysSinceLastQuizForSkill,
      recommendationType: 'SUPPORT_GROUP_QUIZ',
      targetType: AssignmentTargetType.WEAK_STUDENTS,
      reason: `${affectedStudentCount} students are below average in ${focusSkillName}. Target the weak group instead of the whole class.`,
      actionLabel: `Assign support-group quiz for ${focusSkillName}`,
    };
  }

  private async getRecentQuizSignal(
    teacherId: UserId,
    focusSkillId: SkillId,
    focusSkillName: string,
  ): Promise<{ recentQuizAssigned: boolean; daysSinceLastQuizForSkill: number | null }> {
    const [assignments, quizzes] = await Promise.all([
      this.assignmentsRepo.findByTeacherId(String(teacherId)),
      this.quizzesRepo.findByTeacherId(String(teacherId)),
    ]);
    const quizMap = new Map(quizzes.map((quiz) => [quiz.quizId, quiz]));
    const normalizedSkillName = this.normalizeSkillToken(focusSkillName);
    const normalizedSkillId = this.normalizeSkillToken(focusSkillId);

    const matchingAssignments = assignments
      .filter((assignment) => assignment.type === AssignmentType.QUIZ)
      .filter((assignment) => assignment.status === AssignmentStatus.PUBLISHED)
      .filter((assignment) => assignment.sourceType === AssignmentSourceType.TEACHER_CREATED)
      .flatMap((assignment) => {
        const quiz = quizMap.get(assignment.sourceId);
        if (!quiz?.skillFocus) {
          return [];
        }

        const normalizedQuizSkill = this.normalizeSkillToken(quiz.skillFocus);
        if (
          normalizedQuizSkill !== normalizedSkillName &&
          normalizedQuizSkill !== normalizedSkillId
        ) {
          return [];
        }

        return assignment;
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

    const latestAssignment = matchingAssignments[0];
    if (!latestAssignment) {
      return {
        recentQuizAssigned: false,
        daysSinceLastQuizForSkill: null,
      };
    }

    const millisSinceLastQuiz =
      Date.now() - new Date(latestAssignment.createdAt).getTime();
    const daysSinceLastQuizForSkill = Math.max(
      0,
      Math.floor(millisSinceLastQuiz / (1000 * 60 * 60 * 24)),
    );

    return {
      recentQuizAssigned: daysSinceLastQuizForSkill < 7,
      daysSinceLastQuizForSkill,
    };
  }

  private normalizeSkillToken(value: string): string {
    return String(value || '').trim().toLowerCase();
  }

  private async getResultsForTeacher(
    teacherId?: UserId,
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): Promise<AssesmentResult[]> {
    const results = await this.baselineProcessingService.getAllResults();
    const filteredResults = this.filterResultsBySubject(results, subjectId);

    if (!teacherId) {
      return filteredResults;
    }

    const students = await this.studentsService.getStudents(teacherId);
    const studentIds = new Set(students.map((student) => student.studentId));
    return filteredResults.filter((result) => studentIds.has(result.studentId));
  }

  private getSkillLabel(skillId: SkillId): string {
    switch (skillId) {
      case 'skill_counting':
        return 'Counting Skills';
      case 'skill_number_manipulation':
        return 'Number Manipulation';
      case 'skill_problem_solving':
        return 'Problem Solving';
      case 'skill_vocal':
        return 'Vocal Awareness';
      case 'skill_sounds_of_letters':
        return 'Sounds of Letters';
      case 'skill_writing':
        return 'Writing';
      default:
        return skillId;
    }
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

  private filterResultsBySubject(
    results: AssesmentResult[],
    subjectId: SubjectId = DEFAULT_SUBJECT_ID,
  ): AssesmentResult[] {
    const requiredSkillIds = new Set(this.getRequiredSkillIds(subjectId));
    return results.filter((result) => requiredSkillIds.has(result.skillId));
  }
}
