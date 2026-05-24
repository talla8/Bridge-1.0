import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { InstitutionsService } from './institutions.service';

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
}
