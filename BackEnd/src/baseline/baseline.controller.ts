import {
  Controller,
  UploadedFile,
  UseInterceptors,
  Post,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { UploadService } from './upload.service';

@Controller('baseline')
export class BaselineController {
  constructor(private readonly uploadService: UploadService) {}
  @Roles([RoleId.Teacher])
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
}
