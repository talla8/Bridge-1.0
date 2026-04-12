import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { SubjectId } from 'src/domain/ids';
import { Plan } from 'src/domain/plan';
import { PlanInputService } from './plan-input.service';
import { PlansService } from './plans.service';
import { GeneratePlanDTO } from './DTO/generate-plan.dto';
import { SaveWeeklySlotsDTO } from './DTO/save-weekly-slots.dto';
import type { SavedWeeklySlots } from './plan-input.service';
import { UpdatePlanItemStatusDTO } from './DTO/update-plan-item-status.dto';
import { UpdatePlanItemTimeDTO } from './DTO/update-plan-item-time.dto';

@Controller('plans')
export class PlansController {
  constructor(
    private readonly planInputService: PlanInputService,
    private readonly plansService: PlansService,
  ) {}

  @Post('weekly-slots')
  async saveWeeklySlots(
    @Req() req,
    @Body() saveWeeklySlotsDto: SaveWeeklySlotsDTO,
  ): Promise<SavedWeeklySlots> {
    return this.planInputService.saveWeeklySlots(
      req.user.sub,
      saveWeeklySlotsDto,
    );
  }

  @Get('weekly-slots/:subjectId')
  getWeeklySlots(
    @Req() req,
    @Param('subjectId') subjectId: SubjectId,
  ): SavedWeeklySlots | null {
    return this.planInputService.getWeeklySlots(req.user.sub, subjectId);
  }

  @Post('generate')
  generatePlan(
    @Req() req,
    @Body() generatePlanDto: GeneratePlanDTO,
  ): Promise<Plan> {
    return this.plansService.generatePlan(
      req.user.sub,
      generatePlanDto.subjectId,
      generatePlanDto.semester,
    );
  }

  @Get('todo/today')
  getTeacherTodoList(@Req() req, @Query('date') date?: string) {
    return this.plansService.getTeacherTodoList(
      req.user.sub,
      date ? new Date(date) : new Date(),
    );
  }

  @Get(':planId/progress')
  getPlanProgress(@Param('planId') planId: string, @Req() req) {
    return this.plansService.getPlanProgress(req.user.sub, planId);
  }

  @Get(':planId/history')
  getPlanHistory(@Param('planId') planId: string, @Req() req) {
    return this.plansService.getPlanHistory(req.user.sub, planId);
  }

  @Post(':planId/replan')
  replanFromSession(
    @Param('planId') planId: string,
    @Req() req,
    @Body('fromSessionId') fromSessionId: string,
  ) {
    return this.plansService.replanFromSession(
      req.user.sub,
      planId,
      fromSessionId,
    );
  }

  //   Add teacher endpoints like:
  // - `PATCH /plans/:planId/items/time`
  // - `PATCH /plans/:planId/items/status`
  @Patch(':planId/items/time')
  updatePlanItemTime(
    @Param('planId') planId: string,
    @Req() req,
    @Body() dto: UpdatePlanItemTimeDTO,
  ) {
    return this.plansService.updateItemEstimatedTime(
      req.user.sub,
      planId,
      dto.planItemId,
      dto.estimatedMinutes,
      dto.sessionId,
    );
  }

  @Patch(':planId/items/status')
  updatePlanItemStatus(
    @Param('planId') planId: string,
    @Req() req,
    @Body() dto: UpdatePlanItemStatusDTO,
  ) {
    return this.plansService.updateItemStatus(
      req.user.sub,
      planId,
      dto.planItemId,
      dto.status,
      dto.sessionId,
    );
  }
}
