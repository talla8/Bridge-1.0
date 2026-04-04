import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { SubjectId } from 'src/domain/ids';
import { Plan } from 'src/domain/plan';
import { PlanInputService } from './plan-input.service';
import { PlansService } from './plans.service';
import { GeneratePlanDTO } from './DTO/generate-plan.dto';
import { SaveWeeklySlotsDTO } from './DTO/save-weekly-slots.dto';
import type { SavedWeeklySlots } from './plan-input.service';

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
}
