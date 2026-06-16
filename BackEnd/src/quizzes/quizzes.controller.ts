import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateQuizDTO } from './DTO/create-quiz.dto';
import { ReviewQuizResultDTO } from './DTO/review-quiz-result.dto';
import { QuizzesService } from './quizzes.service';
import {
  quizAttachmentMulterOptions,
  uploadedQuizFilesByField,
} from './attachment-upload';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor(quizAttachmentMulterOptions))
  createQuiz(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = this.parseCreateQuizBody(body);
    return this.quizzesService.createQuiz(
      req.user.sub,
      dto,
      uploadedQuizFilesByField(files),
    );
  }

  @Get('library')
  getQuizLibrary(
    @Query('subjectId') subjectId?: string,
    @Query('skillId') skillId?: string,
  ) {
    return this.quizzesService.getQuizLibraryTemplates(subjectId, skillId);
  }

  @Get('mine')
  getTeacherQuizzes(@Req() req) {
    return this.quizzesService.getTeacherQuizzes(req.user.sub);
  }

  @Get(':quizId')
  getQuizById(@Req() req, @Param('quizId') quizId: string) {
    return this.quizzesService.getTeacherQuizById(req.user.sub, quizId);
  }

  @Get('review/pending')
  getPendingReviews(@Req() req) {
    return this.quizzesService.getPendingReviews(req.user.sub);
  }

  @Get('review/reviewed')
  getReviewedHistory(@Req() req) {
    return this.quizzesService.getReviewedHistory(req.user.sub);
  }

  @Get('results/:quizResultId')
  getQuizResultDetail(@Req() req, @Param('quizResultId') quizResultId: string) {
    return this.quizzesService.getTeacherQuizResultDetail(
      req.user.sub,
      quizResultId,
    );
  }

  @Post('results/:quizResultId/review')
  reviewQuizResult(
    @Req() req,
    @Param('quizResultId') quizResultId: string,
    @Body() dto: ReviewQuizResultDTO,
  ) {
    return this.quizzesService.reviewTeacherQuizResult(
      req.user.sub,
      quizResultId,
      Number(dto.score),
      dto.feedback,
    );
  }

  private parseCreateQuizBody(body: any): CreateQuizDTO {
    if (body?.draft) {
      try {
        return JSON.parse(String(body.draft));
      } catch (_error) {
        throw new BadRequestException('Invalid quiz draft payload.');
      }
    }

    return body as CreateQuizDTO;
  }
}
