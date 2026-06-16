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
import { CreateInstitutionTeacherDTO } from './DTO/create-teacher.dto';
import { CreateInstitutionNotificationDTO } from './DTO/create-notification.dto';
import { CreateInstitutionTaskDTO } from './DTO/create-task.dto';
import { ToggleTeacherSelfRegistrationDTO } from './DTO/toggle-teacher-self-registration.dto';
import { UpdateInstitutionTaskStatusDTO } from './DTO/update-task-status.dto';
import { UpdateInstitutionTaskVisibilityDTO } from './DTO/update-task-visibility.dto';
import { InstitutionsService } from './institutions.service';
import {
  institutionAttachmentMulterOptions,
  normalizeStringArray,
  uploadedFilesToAttachments,
} from './attachment-upload';

@Controller('institutions')
@Roles([RoleId.INSTITUTION])
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('me/profile')
  getMyInstitutionProfile(@Req() req) {
    return this.institutionsService.getInstitutionProfile(req.user.sub);
  }

  @Get('me/dashboard')
  getMyInstitutionDashboard(@Req() req) {
    return this.institutionsService.getDashboard(req.user.sub);
  }

  @Get('me/teachers')
  getMyTeachers(@Req() req) {
    return this.institutionsService.getTeachers(req.user.sub);
  }

  @Get('me/teachers/:teacherUserId')
  getTeacherDetail(@Req() req, @Param('teacherUserId') teacherUserId: string) {
    return this.institutionsService.getTeacherDetail(req.user.sub, teacherUserId);
  }

  @Post('me/teachers')
  createTeacher(@Req() req, @Body() dto: CreateInstitutionTeacherDTO) {
    return this.institutionsService.createTeacher(req.user.sub, dto);
  }

  @Get('me/join-code')
  getTeacherJoinCode(@Req() req) {
    return this.institutionsService.getTeacherJoinCode(req.user.sub);
  }

  @Post('me/join-code/regenerate')
  regenerateTeacherJoinCode(@Req() req) {
    return this.institutionsService.regenerateTeacherJoinCode(req.user.sub);
  }

  @Patch('me/join-code/self-registration')
  toggleTeacherSelfRegistration(
    @Req() req,
    @Body() dto: ToggleTeacherSelfRegistrationDTO,
  ) {
    return this.institutionsService.toggleTeacherSelfRegistration(
      req.user.sub,
      dto.enabled,
    );
  }

  @Get('me/notifications')
  getNotifications(@Req() req) {
    return this.institutionsService.getNotifications(req.user.sub);
  }

  @Post('me/notifications')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, institutionAttachmentMulterOptions),
  )
  createNotification(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateInstitutionNotificationDTO = {
      title: String(body.title ?? ''),
      message: String(body.message ?? ''),
      recipientTeacherUserIds: normalizeStringArray(
        body.recipientTeacherUserIds,
      ),
      recipientTeacherEmails: normalizeStringArray(body.recipientTeacherEmails),
      attachments: [
        ...normalizeStringArray(body.attachments),
        ...uploadedFilesToAttachments(files),
      ],
    };
    return this.institutionsService.createNotification(req.user.sub, dto);
  }

  @Get('me/tasks')
  getTasks(@Req() req) {
    return this.institutionsService.getTasks(req.user.sub);
  }

  @Patch('me/tasks/:taskId/status')
  updateTaskStatus(
    @Req() req,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateInstitutionTaskStatusDTO,
  ) {
    return this.institutionsService.updateTaskStatus(
      req.user.sub,
      taskId,
      dto.status,
    );
  }

  @Patch('me/tasks/:taskId/visibility')
  updateTaskVisibility(
    @Req() req,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateInstitutionTaskVisibilityDTO,
  ) {
    return this.institutionsService.updateTaskVisibility(
      req.user.sub,
      taskId,
      dto.isHidden,
    );
  }

  @Post('me/tasks')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, institutionAttachmentMulterOptions),
  )
  createTask(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateInstitutionTaskDTO = {
      title: String(body.title ?? ''),
      description: body.description ? String(body.description) : undefined,
      assignedTeacherUserIds: normalizeStringArray(body.assignedTeacherUserIds),
      assignedTeacherEmails: normalizeStringArray(body.assignedTeacherEmails),
      attachments: [
        ...normalizeStringArray(body.attachments),
        ...uploadedFilesToAttachments(files),
      ],
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
    };
    return this.institutionsService.createTask(req.user.sub, dto);
  }
}
