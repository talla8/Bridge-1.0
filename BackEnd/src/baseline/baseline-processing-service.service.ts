import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SqliteAssessmentResultsRepo } from 'src/database/sqlite-assessment-result.repo';
import { AssesmentResult } from 'src/domain/assesmentResult';
import { SubjectId, UploadId, UserId } from 'src/domain/ids';
import { getSubjectSkillDefinitions } from 'src/domain/subject-skill-config';
import { Status } from 'src/domain/upload';
import { MatchedBaselineRow } from './student-matching-service.service';
import { UploadService } from './upload.service';

@Injectable()
export class BaselineProcessingServiceService {
  constructor(
    private readonly assessmentResultsRepo: SqliteAssessmentResultsRepo,
    private readonly uploadService: UploadService,
  ) {}

  buildAssessmentResults(
    matchedRows: MatchedBaselineRow[],
    uploadId: UploadId,
    subjectId?: SubjectId,
  ): AssesmentResult[] {
    const skillDefinitions = getSubjectSkillDefinitions(subjectId);

    return matchedRows.flatMap((row, rowIndex) => {
      return skillDefinitions.map((definition) =>
        this.createAssessmentResult(
          uploadId,
          row.studentId,
          definition.skillId,
          row[definition.field],
          rowIndex,
          definition.maxScore,
        ),
      );
    });
  }

  async saveAssessmentResults(
    teacherId: UserId,
    matchedRows: MatchedBaselineRow[],
    uploadId?: UploadId,
    subjectId?: SubjectId,
  ): Promise<AssesmentResult[]> {
    const resolvedUploadId = await this.resolveUploadId(
      teacherId,
      uploadId,
      subjectId,
    );
    const assesmentResults = this.buildAssessmentResults(
      matchedRows,
      resolvedUploadId,
      subjectId,
    );
    const savedResults =
      await this.assessmentResultsRepo.createAssesmentResult(assesmentResults);
    await this.uploadService.updateStatus(resolvedUploadId, Status.PROCESSED);
    return savedResults;
  }

  private createAssessmentResult(
    uploadId: UploadId,
    studentId: AssesmentResult['studentId'],
    skillId: AssesmentResult['skillId'],
    score: number | null,
    rowIndex: number,
    maxScore: number,
  ): AssesmentResult {
    const safeScore = score ?? 0;

    return {
      resultId: `result_${uploadId}_${rowIndex + 1}_${skillId}`,
      uploadId,
      studentId,
      skillId,
      totalScore: safeScore,
      level: this.getLevelFromScore(safeScore, maxScore),
    };
  }

  private getLevelFromScore(score: number, maxScore: number): string {
    const percentage = maxScore === 0 ? 0 : (score / maxScore) * 100;

    if (percentage < 50) {
      return 'Needs Support';
    }

    if (percentage < 80) {
      return 'Intermediate';
    }

    return 'Advanced';
  }
  async getAllResults(): Promise<AssesmentResult[]> {
    return this.assessmentResultsRepo.findAll();
  }

  async findByStudentId(id: string): Promise<AssesmentResult[]> {
    return this.assessmentResultsRepo.findByStudentId(id);
  }

  private async resolveUploadId(
    teacherId: UserId,
    uploadId?: UploadId,
    subjectId?: SubjectId,
  ): Promise<UploadId> {
    if (uploadId) {
      const upload = await this.uploadService.findById(uploadId);
      if (!upload) {
        throw new NotFoundException(
          `Upload ${String(uploadId)} was not found.`,
        );
      }

      if (String(upload.teacherId) !== String(teacherId)) {
        throw new BadRequestException(
          'Upload does not belong to the current teacher.',
        );
      }

      return upload.uploadId;
    }

    if (!subjectId) {
      throw new BadRequestException(
        'subjectId is required when uploadId is not provided.',
      );
    }

    const latestUpload = await this.uploadService.findLatestForTeacherSubject(
      teacherId,
      subjectId,
    );
    if (!latestUpload) {
      throw new NotFoundException(
        'No upload was found for this teacher and subject.',
      );
    }

    return latestUpload.uploadId;
  }
}
