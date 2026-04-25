import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QuizQuestionType } from 'src/domain/quiz';
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
        type?: QuizQuestionType;
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
        selectedOptionId?: string;
        essayAnswer?: string;
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
        selectedOptionId?: string;
        essayAnswer?: string;
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

  @Post(':supportProgramId/milestones/:milestoneId/exercise-results')
  recordMilestoneExerciseResult(
    @Param('supportProgramId') supportProgramId: string,
    @Param('milestoneId') milestoneId: string,
    @Body()
    body: {
      studentId: string;
      supportItemId: string;
      passed?: boolean;
      answer?: string;
    },
  ) {
    return this.supportProgramsService.recordMilestoneExerciseResult(
      supportProgramId,
      milestoneId,
      body.studentId,
      body.supportItemId,
      body.passed,
      body.answer,
    );
  }

  @Post('quiz-results/:quizResultId/review')
  reviewQuizResult(
    @Param('quizResultId') quizResultId: string,
    @Body() body: { score: number; feedback?: string },
  ) {
    return this.supportProgramsService.reviewQuizResult(
      quizResultId,
      Number(body.score),
      body.feedback,
    );
  }

  @Post('exercise-results/:exerciseResultId/review')
  reviewExerciseResult(
    @Param('exerciseResultId') exerciseResultId: string,
    @Body() body: { passed: boolean; feedback?: string },
  ) {
    return this.supportProgramsService.reviewExerciseResult(
      exerciseResultId,
      Boolean(body.passed),
      body.feedback,
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
