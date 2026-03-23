import {
  Body,
  Controller,
  UploadedFile,
  UseInterceptors,
  Post,
  ParseFilePipeBuilder,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { UploadService } from './upload.service';
import { NormalizedBaselineRow } from './baselineParser.service';
import {
  MatchedBaselineRow,
  StudentMatchingServiceService,
} from './student-matching-service.service';
import { BaselineProcessingServiceService } from './baseline-processing-service.service';
import { AssesmentResult } from 'src/domain/assesmentResult';

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
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<Record<string, unknown>[]> {
    return this.uploadService.parseBaseline(file);
  }
  @Post('validation')
  @UseInterceptors(FileInterceptor('file'))
  async validateHeaders(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<unknown> {
    return this.uploadService.validateHeaders(file.buffer);
  }

  @Post('normalization')
  @UseInterceptors(FileInterceptor('file'))
  async normalizeRows(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<unknown> {
    return this.uploadService.normalizeRows(file.buffer);
  }
  @Post('matchStudents')
  async matchStudents(
    @Body() normalizedRows: NormalizedBaselineRow[],
  ): Promise<MatchedBaselineRow[]> {
    return this.studentMatchingService.matchStudents(normalizedRows);
  }

    @Post('save')
  async saveAssessmentResults(
    @Body() normalizedRows: MatchedBaselineRow[],
  ): Promise<AssesmentResult[]> {
    return this.baselineProcessingServiceService.saveAssessmentResults(
      normalizedRows,
    );
  }
}
