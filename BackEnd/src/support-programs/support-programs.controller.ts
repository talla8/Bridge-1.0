import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SupportProgramsService } from './support-programs.service';

@Controller('support-programs')
export class SupportProgramsController {
  constructor(
    private readonly supportProgramsService: SupportProgramsService,
  ) {}

  @Get('students/:studentId/progress')
  getStudentProgress(@Param('studentId') studentId: string) {
    return this.supportProgramsService.getStudentProgress(studentId);
  }

  @Post(':supportProgramId/milestones/:milestoneId/quizzes')
  createMilestoneQuiz(
    @Param('supportProgramId') supportProgramId: string,
    @Param('milestoneId') milestoneId: string,
    @Body()
    body: {
      title: string;
      questions: {
        prompt: string;
        options: {
          text: string;
          isCorrect: boolean;
        }[];
      }[];
    },
  ) {
    return this.supportProgramsService.createMilestoneQuiz(
      supportProgramId,
      milestoneId,
      body,
    );
  }

  @Post('quizzes/:quizId/submissions')
  submitQuiz(
    @Param('quizId') quizId: string,
    @Body()
    body: {
      studentId: string;
      answers: {
        questionId: string;
        selectedOptionId: string;
      }[];
    },
  ) {
    return this.supportProgramsService.submitQuiz(
      quizId,
      body.studentId,
      body.answers,
    );
  }

  @Post('quizzes/:quizId/submit')
  submitQuizResult(
    @Param('quizId') quizId: string,
    @Body()
    body: {
      studentId: string;
      answers: {
        questionId: string;
        selectedOptionId: string;
      }[];
    },
  ) {
    return this.supportProgramsService.submitQuiz(
      quizId,
      body.studentId,
      body.answers,
    );
  }

  @Post(':supportProgramId/milestones/:milestoneId/quiz-results')
  recordMilestoneQuizResult(
    @Param('supportProgramId') supportProgramId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: { studentId: string; quizId: string; score: number },
  ) {
    return this.supportProgramsService.recordMilestoneQuizResult(
      supportProgramId,
      milestoneId,
      body.studentId,
      body.quizId,
      Number(body.score),
    );
  }

  @Get(':supportProgramId/milestones/:milestoneId/quiz-progress')
  getMilestoneQuizProgress(
    @Param('supportProgramId') supportProgramId: string,
    @Param('milestoneId') milestoneId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.supportProgramsService.getMilestoneQuizProgress(
      supportProgramId,
      milestoneId,
      studentId,
    );
  }

  @Get('milestones/:milestoneId/progress')
  calculateMilestoneProgress(
    @Param('milestoneId') milestoneId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.supportProgramsService.calculateMilestoneProgress(
      studentId,
      milestoneId,
    );
  }
}
