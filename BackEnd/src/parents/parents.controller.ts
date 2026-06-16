import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { StudentId } from 'src/domain/ids';
import {
  quizAttachmentMulterOptions,
  uploadedQuizFilesByField,
} from 'src/quizzes/attachment-upload';
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
import { LinkParentStudentDTO } from './DTO/link-parent-student.dto';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me')
  getProfile(@Req() req): Promise<ParentProfileSummary> {
    return this.parentsService.getProfile(req.user.sub);
  }

  @Post('me/students/link')
  linkStudent(
    @Req() req,
    @Body() dto: LinkParentStudentDTO,
  ): Promise<ParentProfileSummary> {
    return this.parentsService.linkStudentByCode(req.user.sub, dto);
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
  @UseInterceptors(AnyFilesInterceptor(quizAttachmentMulterOptions))
  submitAssignedQuiz(
    @Req() req,
    @Param('studentId') studentId: StudentId,
    @Param('assignmentId') assignmentId: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ParentQuizSubmissionResult> {
    const dto = this.parseSubmitQuizBody(body);
    return this.parentsService.submitAssignedQuiz(
      req.user.sub,
      studentId,
      assignmentId,
      dto,
      uploadedQuizFilesByField(files),
    );
  }

  private parseSubmitQuizBody(body: any): SubmitParentQuizDTO {
    if (body?.answers && typeof body.answers === 'string') {
      try {
        return {
          answers: JSON.parse(body.answers),
        };
      } catch (_error) {
        throw new BadRequestException('Invalid quiz answers payload.');
      }
    }

    return body as SubmitParentQuizDTO;
  }
}
