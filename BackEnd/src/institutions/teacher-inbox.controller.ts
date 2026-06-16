import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { InstitutionsService } from './institutions.service';
import { CreateTeacherMessageDTO } from './DTO/create-teacher-message.dto';
import { SubmitInstitutionTaskDTO } from './DTO/submit-task.dto';
import {
  institutionAttachmentMulterOptions,
  normalizeStringArray,
  uploadedFilesToAttachments,
} from './attachment-upload';

@Controller('teacher-inbox')
@Roles([RoleId.TEACHER])
export class TeacherInboxController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('notifications')
  getTeacherNotifications(@Req() req) {
    return this.institutionsService.getTeacherNotifications(req.user.sub);
  }

  @Get('tasks')
  getTeacherTasks(@Req() req) {
    return this.institutionsService.getTeacherTasks(req.user.sub);
  }

  @Post('messages')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, institutionAttachmentMulterOptions),
  )
  createTeacherMessage(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateTeacherMessageDTO = {
      title: String(body.title ?? ''),
      message: String(body.message ?? ''),
      attachments: [
        ...normalizeStringArray(body.attachments),
        ...uploadedFilesToAttachments(files),
      ],
    };
    return this.institutionsService.createTeacherMessage(req.user.sub, dto);
  }

  @Patch('tasks/:taskId/submit')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, institutionAttachmentMulterOptions),
  )
  submitTeacherTask(
    @Req() req,
    @Param('taskId') taskId: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: SubmitInstitutionTaskDTO = {
      message: body.message ? String(body.message) : undefined,
      attachments: [
        ...normalizeStringArray(body.attachments),
        ...uploadedFilesToAttachments(files),
      ],
    };
    return this.institutionsService.submitTeacherTask(req.user.sub, taskId, dto);
  }

  @Patch('tasks/:taskId/resubmit')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, institutionAttachmentMulterOptions),
  )
  resubmitTeacherTask(
    @Req() req,
    @Param('taskId') taskId: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: SubmitInstitutionTaskDTO = {
      message: body.message ? String(body.message) : undefined,
      attachments: [
        ...normalizeStringArray(body.attachments),
        ...uploadedFilesToAttachments(files),
      ],
    };
    return this.institutionsService.resubmitTeacherTask(
      req.user.sub,
      taskId,
      dto,
    );
  }
}
