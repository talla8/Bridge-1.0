import { Injectable } from '@nestjs/common';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { SkillId, UploadId } from 'src/domain/ids';
import { InMemoryAssesmentResultsRepo } from 'src/infrastructure/in-memory/in-memory-assesmentResult.repo';
import { MatchedBaselineRow } from './student-matching-service.service';

@Injectable()
export class BaselineProcessingServiceService {
   uploadId = '1';
  private readonly scoreFieldToSkillId: Record<
    'vocal' | 'soundsOfLetters' | 'writing',
    SkillId
  > = {
    vocal: 'skill_vocal',
    soundsOfLetters: 'skill_sounds_of_letters',
    writing: 'skill_writing',
  };

  constructor(
    private readonly assessmentResultsRepo: InMemoryAssesmentResultsRepo,
  ) {}

  buildAssessmentResults(
    matchedRows: MatchedBaselineRow[],
    // uploadId?: UploadId,
  ): AssesmentResult[] {
    return matchedRows.flatMap((row, rowIndex) => {
      return [
        this.createAssessmentResult(
          this.uploadId,
          row.studentId,
          this.scoreFieldToSkillId.vocal,
          row.vocal,
          rowIndex,
          'vocal',
        ),
        this.createAssessmentResult(
          this.uploadId,
          row.studentId,
          this.scoreFieldToSkillId.soundsOfLetters,
          row.soundsOfLetters,
          rowIndex,
          'soundsOfLetters',
        ),
        this.createAssessmentResult(
          this.uploadId,
          row.studentId,
          this.scoreFieldToSkillId.writing,
          row.writing,
          rowIndex,
          'writing',
        ),
      ];
    });
  }

  async saveAssessmentResults(
    matchedRows: MatchedBaselineRow[],
    uploadId?: UploadId,
  ): Promise<AssesmentResult[]> {
    // const assesmentResults = this.buildAssessmentResults(matchedRows, uploadId);
    const assesmentResults = this.buildAssessmentResults(matchedRows);
    console.log("##########################################");
    console.log(assesmentResults);
    return this.assessmentResultsRepo.createAssesmentResult(assesmentResults);
  }

  private createAssessmentResult(
    uploadId: UploadId,
    studentId: AssesmentResult['studentId'],
    skillId: SkillId,
    score: number | null,
    rowIndex: number,
    scoreField: string,
  ): AssesmentResult {
    const safeScore = score ?? 0;

    return {
      resultId: `result_${uploadId}_${rowIndex + 1}_${skillId}`,
      uploadId,
      studentId,
      skillId,
      totalScore: safeScore,
      level: this.getLevelFromScore(safeScore, scoreField),
    };
  }

  private getLevelFromScore(score: number, scoreField: string): string {
    const maxScore = this.getMaxScore(scoreField);
    const percentage = maxScore === 0 ? 0 : (score / maxScore) * 100;

    if (percentage < 50) {
      return 'Needs Support';
    }

    if (percentage < 80) {
      return 'Intermediate';
    }

    return 'Advanced';
  }

  private getMaxScore(scoreField: string): number {
    switch (scoreField) {
      case 'vocal':
        return 6;
      case 'soundsOfLetters':
        return 8;
      case 'writing':
        return 4;
      default:
        return 100;
    }
  }

  async getAllResults(): Promise<AssesmentResult[]> {
    return this.assessmentResultsRepo.findAll();
  }

  async findByStudentId(id: string): Promise<AssesmentResult[]> {
    console.log("from the baseline proccesing service id =  ");
    console.log (id);
    return this.assessmentResultsRepo.findByStudentId(id);
  }
}
