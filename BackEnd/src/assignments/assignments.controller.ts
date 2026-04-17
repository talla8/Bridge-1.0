import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PublishAssignmentDTO } from './DTO/publish-assignment.dto';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('publish')
  publishAssignment(@Req() req, @Body() dto: PublishAssignmentDTO) {
    return this.assignmentsService.publishAssignment(req.user.sub, dto);
  }

  @Get('teacher')
  getTeacherAssignments(@Req() req) {
    return this.assignmentsService.getTeacherAssignments(req.user.sub);
  }

  @Get(':assignmentId')
  getAssignmentById(@Req() req, @Param('assignmentId') assignmentId: string) {
    return this.assignmentsService.getAssignmentById(
      req.user.sub,
      assignmentId,
    );
  }
}
