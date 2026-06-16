import {
  Body,
  Controller,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  Post,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { NormalizedBaselineRow } from './baselineParser.service';
import {
  MatchedBaselineRow,
  StudentMatchingServiceService,
} from './student-matching-service.service';
import { BaselineProcessingServiceService } from './baseline-processing-service.service';
import { AssesmentResult } from 'src/domain/assesmentResult';
import type { SubjectId } from 'src/domain/ids';
import { Status } from 'src/domain/upload';

// @Roles([RoleId.Teacher])
@Controller('baseline')
export class BaselineController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly studentMatchingService: StudentMatchingServiceService,
    private readonly baselineProcessingServiceService: BaselineProcessingServiceService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBaselineExam(
    @Req() req,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .build(),
    )
    file: Express.Multer.File,
    @Query('subjectId') subjectId?: SubjectId,
  ): Promise<Record<string, unknown>[]> {
    const parsedRows = await this.uploadService.parseBaseline(file);

    if (subjectId) {
      await this.uploadService.create({
        teacherId: req.user.sub,
        subjectId,
        filePath: file.originalname,
        status: Status.PARSED,
      });
    }

    return parsedRows;
  }
  @Post('validation')
  @UseInterceptors(FileInterceptor('file'))
  async validateHeaders(
    @UploadedFile() file: Express.Multer.File,
    @Query('subjectId') subjectId?: SubjectId,
  ): Promise<unknown> {
    return this.uploadService.validateHeaders(file.buffer, subjectId);
  }

  @Post('normalization')
  @UseInterceptors(FileInterceptor('file'))
  async normalizeRows(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('subjectId') subjectId?: SubjectId,
  ): Promise<unknown> {
    const normalizedRows = await this.uploadService.normalizeRows(
      file.buffer,
      subjectId,
    );

    if (subjectId) {
      await this.uploadService.create({
        teacherId: req.user.sub,
        subjectId,
        filePath: file.originalname,
        status: Status.PARSED,
      });
    }

    return normalizedRows;
  }
  @Post('matchStudents')
  async matchStudents(
    @Req() req,
    @Body() normalizedRows: NormalizedBaselineRow[],
  ): Promise<MatchedBaselineRow[]> {
    return this.studentMatchingService.matchStudents(
      normalizedRows,
      req.user.sub,
    );
  }
  @Post('save')
  async saveAssessmentResults(
    @Req() req,
    @Body() normalizedRows: MatchedBaselineRow[],
    @Query('uploadId') uploadId?: string,
    @Query('subjectId') subjectId?: SubjectId,
  ): Promise<AssesmentResult[]> {
    return this.baselineProcessingServiceService.saveAssessmentResults(
      req.user.sub,
      normalizedRows,
      uploadId,
      subjectId,
    );
  }
}
