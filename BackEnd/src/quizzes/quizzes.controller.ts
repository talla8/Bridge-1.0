import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { CreateQuizDTO } from './DTO/create-quiz.dto';
import { ReviewQuizResultDTO } from './DTO/review-quiz-result.dto';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  createQuiz(@Req() req, @Body() dto: CreateQuizDTO) {
    return this.quizzesService.createQuiz(req.user.sub, dto);
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
}
