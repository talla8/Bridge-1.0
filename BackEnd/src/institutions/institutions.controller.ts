import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { CreateInstitutionTeacherDTO } from './DTO/create-teacher.dto';
import { CreateInstitutionNotificationDTO } from './DTO/create-notification.dto';
import { CreateInstitutionTaskDTO } from './DTO/create-task.dto';
import { ToggleTeacherSelfRegistrationDTO } from './DTO/toggle-teacher-self-registration.dto';
import { InstitutionsService } from './institutions.service';

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
  createNotification(@Req() req, @Body() dto: CreateInstitutionNotificationDTO) {
    return this.institutionsService.createNotification(req.user.sub, dto);
  }

  @Get('me/tasks')
  getTasks(@Req() req) {
    return this.institutionsService.getTasks(req.user.sub);
  }

  @Post('me/tasks')
  createTask(@Req() req, @Body() dto: CreateInstitutionTaskDTO) {
    return this.institutionsService.createTask(req.user.sub, dto);
  }
}
