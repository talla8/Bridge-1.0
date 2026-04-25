import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { StudentId } from 'src/domain/ids';
import {
  ParentAssignedQuizListItem,
  ParentProfileSummary,
  ParentQuizDetails,
  ParentQuizResultDetail,
  ParentQuizResultListItem,
  ParentQuizSubmissionResult,
  ParentStudentDashboard,
  ParentsService,
} from './parents.service';
import { SubmitParentQuizDTO } from './DTO/submit-parent-quiz.dto';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  getProfile(@Req() req): Promise<ParentProfileSummary> {
    return this.parentsService.getProfile(req.user.sub);
  }

  @Get('me/students/:studentId/dashboard')
  getStudentDashboard(
    @Req() req,
    @Param('studentId') studentId: StudentId,
  ): Promise<ParentStudentDashboard> {
    return this.parentsService.getStudentDashboard(req.user.sub, studentId);
  }

  @Get('me/quizzes')
  getAssignedQuizList(@Req() req): Promise<ParentAssignedQuizListItem[]> {
    return this.parentsService.getAssignedQuizList(req.user.sub);
  }

  @Get('me/quiz-results')
  getQuizResults(@Req() req): Promise<ParentQuizResultListItem[]> {
    return this.parentsService.getQuizResults(req.user.sub);
  }

  @Get('me/quiz-results/:quizResultId')
  getQuizResultDetail(
    @Req() req,
    @Param('quizResultId') quizResultId: string,
  ): Promise<ParentQuizResultDetail> {
    return this.parentsService.getQuizResultDetail(req.user.sub, quizResultId);
  }

  @Get('me/students/:studentId/quizzes/:assignmentId')
  getAssignedQuiz(
    @Req() req,
    @Param('studentId') studentId: StudentId,
    @Param('assignmentId') assignmentId: string,
  ): Promise<ParentQuizDetails> {
    return this.parentsService.getAssignedQuiz(
      req.user.sub,
      studentId,
      assignmentId,
    );
  }

  @Post('me/students/:studentId/quizzes/:assignmentId/submit')
  submitAssignedQuiz(
    @Req() req,
    @Param('studentId') studentId: StudentId,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitParentQuizDTO,
  ): Promise<ParentQuizSubmissionResult> {
    return this.parentsService.submitAssignedQuiz(
      req.user.sub,
      studentId,
      assignmentId,
      dto,
    );
  }
}
