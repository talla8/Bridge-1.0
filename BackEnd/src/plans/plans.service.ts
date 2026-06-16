import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurriculumItem } from 'src/domain/curriculum-item';
import { SubjectId, UserId } from 'src/domain/ids';
import { Plan } from 'src/domain/plan';
import { Session } from 'src/domain/session';
import { SubjectOffering } from 'src/domain/subjectOffering';
import { PlanLog, PlanLogActionType } from 'src/domain/planLog';
import { SqlitePlanLogsRepo } from 'src/database/sqlite-plan-log.repo';
import { InMemoryCurriculumItemsRepo } from 'src/infrastructure/in-memory/in-memory-curriculum-item.repo';
import type { WeekDay, WeeklySlotDTO } from './DTO/save-weekly-slots.dto';
import { MAX_PLAN_ITEM_ESTIMATED_MINUTES } from './DTO/update-plan-item-time.dto';
import { PlanInputService } from './plan-input.service';
import { TeacherTodoItem } from './types/teacher-todo-item';
import { Priority } from 'src/statistics/statistics.service';
import { StatisticsService } from 'src/statistics/statistics.service';
import {
  PlanItem,
  PlanItemPriority,
  PlanItemStatus,
} from 'src/domain/plan-item';
import { randomUUID } from 'crypto';
import { SqlitePlansRepo } from 'src/database/sqlite-plan.repo';
import { SqlitePlanItemsRepo } from 'src/database/sqlite-plan-item.repo';
import { SqliteSessionsRepo } from 'src/database/sqlite-session.repo';
import { SqliteSubjectOfferingsRepo } from 'src/database/sqlite-subject-offering.repo';

const priorityToPoints: Record<Priority, number> = {
  [Priority.HIGH]: 10,
  [Priority.MID]: 6,
  [Priority.LOW]: 3,
};

export const semesterTotalWeeks: Record<number, number> = {
  1: 16,
  2: 12,
};

export type UpdatePlanItemStatusResponse = {
  item: PlanItem;
  session: Session;
  progress: PlanMonitoringSummary;
};

export type UpdatePlanItemTimeResponse = {
  session: Session;
  progress: PlanMonitoringSummary;
};

export type ReplanPaceSummary = {
  behindPace: boolean;
  carriedForwardItemsByDay: Record<string, number>;
};

export type ReplanPlanResponse = {
  plan: Plan;
  summary: PlanMonitoringSummary;
  pace: ReplanPaceSummary;
  planOverCapacity: boolean;
  unplacedItems: PlanItem[];
};

export type PlanProgressSummary = {
  planId: string;
  totalItems: number;
  completedItems: number;
  remainingItems: number;
  cancelledItems: number;
  progressPercentage: number;
};

export type PlanArchiveItem = {
  planItemId: string;
  title: string;
  status: PlanItemStatus;
  estimatedTime: number;
  notes?: string;
  sessionId: string;
  sessionDate: Date;
  sessionWeekNo: number;
  day: string;
};

export type PlanReorderReason = 'PROGRESS_BEHIND' | 'SESSION_OVERFLOW';

export type CompressedPlanItemSummary = {
  planItemId: string;
  title: string;
  priority: PlanItemPriority;
  oldEstimatedTime: number;
  newEstimatedTime: number;
};

export type PlanMonitoringSummary = PlanProgressSummary & {
  classSpeedPercentage: number;
  expectedCompletedMinutes: number;
  actualCompletedMinutes: number;
  planNeedsReordering: boolean;
  reorderReasons: PlanReorderReason[];
  postponedItems: PlanArchiveItem[];
  cancelledItemsArchive: PlanArchiveItem[];
  overloadedSessions: number;
  pace: ReplanPaceSummary;
  bufferUsed: boolean;
  bufferMinutesUsed: number;
  compressionApplied: boolean;
  compressedItems: CompressedPlanItemSummary[];
};

const DEFAULT_SESSION_DURATION_MINUTES = 40;
const REVIEW_BUFFER_INTERVAL = 4;
const REVIEW_BUFFER_MINUTES = 10;
const DAY_ORDER: WeekDay[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
];

const PRIORITY_COMPRESSION_ORDER: Record<PlanItemPriority, number> = {
  [PlanItemPriority.LOW]: 0,
  [PlanItemPriority.MID]: 1,
  [PlanItemPriority.HIGH]: 2,
};

@Injectable()
export class PlansService {
  constructor(
    private readonly statService: StatisticsService,
    private readonly curriculumItemsRepo: InMemoryCurriculumItemsRepo,
    private readonly subjectOfferingsRepo: SqliteSubjectOfferingsRepo,
    private readonly plansRepo: SqlitePlansRepo,
    private readonly planLogsRepo: SqlitePlanLogsRepo,
    private readonly planInputService: PlanInputService,
    private readonly planItemRepo: SqlitePlanItemsRepo,
    private readonly sessionRepo: SqliteSessionsRepo,
  ) {}

  async generatePlan(
    teacherId: UserId,
    subjectId: SubjectId,
    semester: 1 | 2,
  ): Promise<Plan> {
    const planId = `plan_${teacherId}_${subjectId}_${semester}_${Date.now()}`;

    const savedWeeklySlots = await this.planInputService.getWeeklySlots(
      teacherId,
      subjectId,
    );

    if (!savedWeeklySlots || savedWeeklySlots.slots.length === 0) {
      throw new BadRequestException(
        'No weekly slots found for this teacher and subject.',
      );
    }

    const subjectOffering = await this.findSubjectOffering(
      teacherId,
      subjectId,
    );
    const requiredItems = await this.curriculumItemsRepo.getRequiredItme({
      grade: subjectOffering.gradeId,
      subject: subjectId,
      semester,
    });

    if (requiredItems.length === 0) {
      throw new BadRequestException(
        'No curriculum items found for this teacher, subject, and semester.',
      );
    }

    const orderedItems = this.sortCurriculumItems(requiredItems);
    const timedItems = await Promise.all(
      orderedItems.map((item) => this.calculateEstimatedTime(item)),
    );

    const sessions = await this.buildSessionsFromSlots(
      teacherId,
      subjectId,
      this.sortWeeklySlots(savedWeeklySlots.slots),
      timedItems,
      semesterTotalWeeks[semester],
      planId,
    );

    const planStartDate = sessions[0]?.sessionDate ?? new Date();
    const plan: Plan = {
      planId,
      planName: `Auto Plan ${subjectId} S${semester}`,
      subjectId,
      startDate: planStartDate,
      totalWeeks: semesterTotalWeeks[semester],
      teacherId,
      sessions,
      autoGenerated: true,
      planJson: JSON.stringify(
        sessions.map((session) => ({
          sessionId: session.sessionId,
          day: session.day,
          slotNumber: session.slotNumber,
          sessionDate: session.sessionDate.toISOString(),
          reviewBufferMinutes: session.reviewBufferMinutes,
          itemIds: session.items.map((item) => item.curriculumItemId),
        })),
      ),
    };

    await this.plansRepo.create(plan);
    await this.saveGeneratedSessions(sessions);
    await this.logPlanGenerated(plan);
    return plan;
  }

  private async saveGeneratedSessions(sessions: Session[]): Promise<void> {
    for (const session of sessions) {
      await this.sessionRepo.create(session);

      for (const item of session.items) {
        await this.planItemRepo.create(item);
      }
    }
  }

  async updateItemEstimatedTime(
    teacherId: UserId,
    planId: string,
    planItemId: string,
    estimatedMinutes: number,
    sessionId: string,
  ): Promise<UpdatePlanItemTimeResponse> {
    if (estimatedMinutes > MAX_PLAN_ITEM_ESTIMATED_MINUTES) {
      throw new BadRequestException(
        `Estimated time cannot exceed ${MAX_PLAN_ITEM_ESTIMATED_MINUTES} minutes per activity.`,
      );
    }

    const planItem = await this.planItemRepo.findById(planItemId);
    if (!planItem) throw new NotFoundException();
    if (planItem.planId !== planId) {
      throw new BadRequestException('Plan item does not belong to plan.');
    }

    const plan = await this.verifyTeacherOwnsPlan(planId, teacherId);
    const planSession = this.findSessionInPlan(plan, sessionId);
    const item = this.findItemInSession(planSession, planItemId); //comment: why do we have this AND the plan item?
    const updatedItem: PlanItem = {
      ...item,
      estimatedTime: estimatedMinutes,
    };

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new NotFoundException(); //comment:  why do we find the session twice???

    this.replaceItemInSession(planSession, updatedItem);
    planSession.usedDuration = this.calculateSessionUsedDuration(planSession);
    // comment: we should add a max to the time
    this.replaceItemInSession(session, updatedItem);
    session.usedDuration = planSession.usedDuration;

    await this.plansRepo.update(plan.planId, { sessions: plan.sessions });
    await this.sessionRepo.update(sessionId, {
      items: session.items,
      usedDuration: session.usedDuration,
    });

    const savedItem = await this.planItemRepo.update(planItemId, {
      estimatedTime: estimatedMinutes,
    });
    if (!savedItem) throw new NotFoundException();

    await this.logPlanItemUpdate(
      savedItem,
      PlanLogActionType.ITEM_TIME_UPDATED,
      {
        oldEstimatedTime: item.estimatedTime,
        newEstimatedTime: estimatedMinutes,
      },
    );
    return {
      session,
      progress: this.calculatePlanMonitoringSummary(plan),
    };
  }

  async updateItemStatus(
    teacherId: UserId,
    planId: string,
    planItemId: string,
    newStatus: PlanItemStatus,
    sessionId: string,
  ): Promise<UpdatePlanItemStatusResponse> {
    const planItem = await this.planItemRepo.findById(planItemId);
    if (!planItem) throw new NotFoundException();
    if (planItem.planId !== planId) {
      throw new BadRequestException('Plan item does not belong to plan.');
    }

    const plan = await this.verifyTeacherOwnsPlan(planId, teacherId);
    const planSession = this.findSessionInPlan(plan, sessionId);
    const item = this.findItemInSession(planSession, planItemId);

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new NotFoundException();

    if (newStatus === item.status) {
      throw new BadRequestException('Plan item already has this status.');
    }

    if (!this.canUpdatePlanItemStatus(item.status, newStatus)) {
      throw new BadRequestException('Invalid plan item status transition.');
    }

    const updatedItem: PlanItem = {
      ...item,
      status: newStatus,
    };

    this.replaceItemInSession(planSession, updatedItem);
    this.replaceItemInSession(session, updatedItem);
    planSession.usedDuration = this.calculateSessionUsedDuration(planSession);
    session.usedDuration = planSession.usedDuration;

    await this.plansRepo.update(plan.planId, { sessions: plan.sessions });
    await this.sessionRepo.update(sessionId, {
      items: session.items,
      usedDuration: session.usedDuration,
    });

    const savedItem = await this.planItemRepo.update(planItemId, {
      status: newStatus,
    });
    if (!savedItem) throw new NotFoundException();

    await this.logPlanItemUpdate(
      savedItem,
      this.getPlanLogActionForStatus(newStatus),
      {
        oldStatus: item.status,
        newStatus,
        targetSessionId: session.sessionId,
        targetSessionDate: session.sessionDate,
      },
    );
    return {
      item: savedItem,
      session,
      progress: this.calculatePlanMonitoringSummary(plan),
    };
  }

  async getPlanProgress(
    teacherId: UserId,
    planId: string,
  ): Promise<PlanMonitoringSummary> {
    const plan = await this.verifyTeacherOwnsPlan(planId, teacherId);
    return this.calculatePlanMonitoringSummary(plan);
  }

  async getPlanHistory(teacherId: UserId, planId: string): Promise<PlanLog[]> {
    await this.verifyTeacherOwnsPlan(planId, teacherId);
    const logs = await this.planLogsRepo.findByPlanId(planId);

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTeacherPlans(teacherId: UserId): Promise<Plan[]> {
    const plans = await this.plansRepo.findAll();

    return plans
      .filter((plan) => String(plan.teacherId) === String(teacherId))
      .sort(
        (a, b) =>
          this.getPlanCreatedTimestamp(b) - this.getPlanCreatedTimestamp(a),
      );
  }

  async getLatestTeacherPlan(teacherId: UserId): Promise<Plan | null> {
    const plans = await this.getTeacherPlans(teacherId);
    return plans[0] ?? null;
  }

  async getTeacherTodoList(
    teacherId: UserId,
    date: Date = new Date(),
  ): Promise<TeacherTodoItem[]> {
    const plans = await this.plansRepo.findAll();
    const todoItems = plans
      .filter((plan) => String(plan.teacherId) === String(teacherId))
      .flatMap((plan) =>
        plan.sessions
          .filter((session) => this.isSameDate(session.sessionDate, date))
          .flatMap((session) =>
            session.items
              .filter((item) => item.status === PlanItemStatus.PLANNED)
              .map((item) => ({
                planId: plan.planId,
                planName: plan.planName,
                subjectId: plan.subjectId,
                sessionId: session.sessionId,
                sessionDate: session.sessionDate,
                sessionWeekNo: session.sessionWeekNo,
                day: session.day,
                slotNumber: session.slotNumber,
                item,
              })),
          ),
      );

    return todoItems.sort(
      (a, b) =>
        this.getDateTime(a.sessionDate) - this.getDateTime(b.sessionDate) ||
        a.slotNumber - b.slotNumber,
    );
  }

  async replanFromSession(
    teacherId: UserId,
    planId: string,
    fromSessionId: string,
  ): Promise<ReplanPlanResponse> {
    if (!fromSessionId) {
      throw new BadRequestException('fromSessionId is required.');
    }

    const plan = await this.verifyTeacherOwnsPlan(planId, teacherId);
    const anchorIndex = plan.sessions.findIndex(
      (session) => session.sessionId === fromSessionId,
    );

    if (anchorIndex === -1) {
      throw new NotFoundException('Session not found');
    }

    const frozenSessions = plan.sessions.slice(0, anchorIndex);
    const futureSessions = plan.sessions.slice(anchorIndex);
    const itemsToReplan = this.sortItemsForReplanning(
      this.collectReplannableItems(futureSessions, anchorIndex),
    );
    const {
      sessions: replannedSessions,
      pace,
      unplacedItems,
    } = this.repackFutureSessions(futureSessions, itemsToReplan, anchorIndex);

    const updatedPlan: Plan = {
      ...plan,
      sessions: [...frozenSessions, ...replannedSessions],
    };

    await this.plansRepo.update(plan.planId, {
      sessions: updatedPlan.sessions,
    });
    await this.saveReplannedSessions(replannedSessions);
    await this.logPlanReplanned(
      updatedPlan,
      fromSessionId,
      pace,
      unplacedItems,
    );

    return {
      plan: updatedPlan,
      summary: this.calculatePlanMonitoringSummary(updatedPlan),
      pace,
      planOverCapacity: unplacedItems.length > 0,
      unplacedItems,
    };
  }

  private collectReplannableItems(
    sessions: Session[],
    anchorIndex: number,
  ): PlanItem[] {
    return sessions.flatMap((session, index) =>
      session.items
        .filter((item) => item.status === PlanItemStatus.PLANNED)
        .map((item) => ({
          ...item,
          originalSessionOrder:
            item.originalSessionOrder ?? anchorIndex + index,
        })),
    );
  }

  private sortItemsForReplanning(items: PlanItem[]): PlanItem[] {
    return [...items].sort((a, b) => {
      const originalSessionDiff =
        (a.originalSessionOrder ?? 0) - (b.originalSessionOrder ?? 0);
      if (originalSessionDiff !== 0) return originalSessionDiff;

      if (a.unitNo !== b.unitNo) return a.unitNo - b.unitNo;
      if (a.lessonNo !== b.lessonNo) return a.lessonNo - b.lessonNo;
      return a.orderInLesson - b.orderInLesson;
    });
  }

  private repackFutureSessions(
    sessions: Session[],
    items: PlanItem[],
    anchorIndex: number,
  ): {
    sessions: Session[];
    pace: ReplanPaceSummary;
    unplacedItems: PlanItem[];
    bufferUsed: boolean;
    bufferMinutesUsed: number;
    compressionApplied: boolean;
    compressedItems: CompressedPlanItemSummary[];
  } {
    const normalPack = this.packFutureSessions(
      sessions,
      items,
      anchorIndex,
      'NORMAL_ONLY',
    );
    let replannedSessions = normalPack.sessions;
    let unplacedItems = normalPack.unplacedItems;
    let carriedForwardItemsByDay = normalPack.carriedForwardItemsByDay;
    let bufferUsed = false;
    let compressionApplied = false;
    let compressedItems: CompressedPlanItemSummary[] = [];

    if (unplacedItems.length > 0) {
      const bufferPack = this.packFutureSessions(
        sessions,
        items,
        anchorIndex,
        'WITH_BUFFER',
      );

      if (bufferPack.unplacedItems.length < unplacedItems.length) {
        replannedSessions = bufferPack.sessions;
        unplacedItems = bufferPack.unplacedItems;
        carriedForwardItemsByDay = bufferPack.carriedForwardItemsByDay;
      }

      if (bufferPack.unplacedItems.length < normalPack.unplacedItems.length) {
        bufferUsed = true;
      } //comment: why do we need this many cases?

      if (bufferPack.unplacedItems.length > 0) {
        const compressionPlan = this.selectivelyCompressItems(
          items,
          sessions,
          anchorIndex,
        );

        if (compressionPlan.itemsChanged) {
          const compressedPack = this.packFutureSessions(
            sessions,
            compressionPlan.items,
            anchorIndex,
            'WITH_BUFFER',
          );

          if (compressedPack.unplacedItems.length < unplacedItems.length) {
            replannedSessions = compressedPack.sessions;
            unplacedItems = compressedPack.unplacedItems;
            carriedForwardItemsByDay = compressedPack.carriedForwardItemsByDay;
            compressionApplied = compressionPlan.compressedItems.length > 0;
            compressedItems = compressionPlan.compressedItems;
            bufferUsed = true;
          }
        }
      }
    }

    const bufferMinutesUsed =
      this.calculateBufferMinutesUsed(replannedSessions);

    return {
      sessions: replannedSessions,
      pace: {
        carriedForwardItemsByDay,
        behindPace: Object.values(carriedForwardItemsByDay).some(
          (count) => count > 1,
        ),
      },
      unplacedItems,
      bufferUsed: bufferUsed || bufferMinutesUsed > 0,
      bufferMinutesUsed,
      compressionApplied,
      compressedItems,
    };
  }

  private packFutureSessions(
    sessions: Session[],
    items: PlanItem[],
    anchorIndex: number,
    capacityMode: 'NORMAL_ONLY' | 'WITH_BUFFER',
  ): {
    sessions: Session[];
    carriedForwardItemsByDay: Record<string, number>;
    unplacedItems: PlanItem[];
  } {
    const carriedForwardItemsByDay: Record<string, number> = {};
    let itemIndex = 0;

    const replannedSessions = sessions.map((session, sessionIndex) => {
      const fixedItems = session.items.filter(
        (item) => item.status !== PlanItemStatus.PLANNED,
      );
      const nextSession: Session = {
        ...session,
        items: [...fixedItems],
      };
      let usedDuration = this.calculateSessionUsedDuration(nextSession);
      const maxAvailableMinutes = this.getSessionAvailableMinutes(
        nextSession,
        capacityMode,
      );

      while (itemIndex < items.length) {
        const item = items[itemIndex];
        const itemMinutes = Number(item.estimatedTime ?? 0);
        const fitsInSession = usedDuration + itemMinutes <= maxAvailableMinutes;

        if (!fitsInSession) {
          break;
        }

        const updatedItem = this.applyCarryForwardMetadata(
          item,
          session,
          anchorIndex + sessionIndex,
          carriedForwardItemsByDay,
        );

        nextSession.items.push(updatedItem);
        usedDuration += itemMinutes;
        itemIndex++;
      }

      nextSession.usedDuration = this.calculateSessionUsedDuration(nextSession);
      return nextSession;
    });

    return {
      sessions: replannedSessions,
      carriedForwardItemsByDay,
      unplacedItems: items.slice(itemIndex),
    };
  }

  private getSessionAvailableMinutes(
    session: Session,
    capacityMode: 'NORMAL_ONLY' | 'WITH_BUFFER',
  ): number {
    if (capacityMode === 'WITH_BUFFER') {
      return session.maxDuration;
    }

    return Math.max(0, session.maxDuration - session.reviewBufferMinutes);
  }

  private selectivelyCompressItems(
    items: PlanItem[],
    sessions: Session[],
    anchorIndex: number,
  ): {
    items: PlanItem[];
    compressedItems: CompressedPlanItemSummary[];
    itemsChanged: boolean;
  } {
    const workingItems = items.map((item) => ({ ...item }));
    const compressedItems: CompressedPlanItemSummary[] = [];
    const maxAttempts = workingItems.length * 12;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const packResult = this.packFutureSessions(
        sessions,
        workingItems,
        anchorIndex,
        'WITH_BUFFER',
      );
      if (packResult.unplacedItems.length === 0) {
        break;
      }

      const deficit = this.calculateEstimatedMinutes(packResult.unplacedItems);
      const candidateIndex = this.findBestCompressionCandidateIndex(
        workingItems,
        deficit,
      );

      if (candidateIndex === -1) {
        break;
      }

      const candidate = workingItems[candidateIndex];
      const oldEstimatedTime = Number(candidate.estimatedTime ?? 0);
      const reductionStep = this.getCompressionStep(candidate);
      const nextEstimatedTime = Math.max(
        Number(candidate.minEstimatedTime ?? oldEstimatedTime),
        oldEstimatedTime - reductionStep,
      );

      if (nextEstimatedTime >= oldEstimatedTime) {
        break;
      }

      workingItems[candidateIndex] = {
        ...candidate,
        estimatedTime: nextEstimatedTime,
      };

      const existingSummary = compressedItems.find(
        (item) => item.planItemId === candidate.planItemId,
      );

      if (existingSummary) {
        existingSummary.newEstimatedTime = nextEstimatedTime;
      } else {
        compressedItems.push({
          planItemId: candidate.planItemId,
          title: candidate.title,
          priority: candidate.priority ?? PlanItemPriority.LOW,
          oldEstimatedTime,
          newEstimatedTime: nextEstimatedTime,
        });
      }

      attempts++;
    }

    return {
      items: workingItems,
      compressedItems,
      itemsChanged: compressedItems.length > 0,
    };
  }

  private findBestCompressionCandidateIndex(
    items: PlanItem[],
    deficit: number,
  ): number {
    const candidates = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => this.isCompressionCandidate(item))
      .sort((left, right) => {
        const priorityDiff =
          PRIORITY_COMPRESSION_ORDER[
            left.item.priority ?? PlanItemPriority.LOW
          ] -
          PRIORITY_COMPRESSION_ORDER[
            right.item.priority ?? PlanItemPriority.LOW
          ];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const leftTime = Number(left.item.estimatedTime ?? 0);
        const rightTime = Number(right.item.estimatedTime ?? 0);
        const timeDiff = rightTime - leftTime;
        if (timeDiff !== 0) {
          return timeDiff;
        }

        const leftAvailable =
          leftTime - Number(left.item.minEstimatedTime ?? leftTime);
        const rightAvailable =
          rightTime - Number(right.item.minEstimatedTime ?? rightTime);
        const availableDiff = rightAvailable - leftAvailable;
        if (availableDiff !== 0) {
          return availableDiff;
        }

        const leftFit = Math.abs(leftAvailable - deficit);
        const rightFit = Math.abs(rightAvailable - deficit);
        return leftFit - rightFit;
      });

    return candidates[0]?.index ?? -1;
  }

  private isCompressionCandidate(item: PlanItem): boolean {
    if (!item.isCompressible) {
      return false;
    }

    const currentEstimatedTime = Number(item.estimatedTime ?? 0);
    const minEstimatedTime = Number(
      item.minEstimatedTime ?? currentEstimatedTime,
    );

    return currentEstimatedTime > minEstimatedTime;
  }

  private getCompressionStep(item: PlanItem): number {
    return item.priority === PlanItemPriority.LOW ? 2 : 1;
  }

  private calculateEstimatedMinutes(items: PlanItem[]): number {
    return items.reduce(
      (total, item) => total + Number(item.estimatedTime ?? 0),
      0,
    );
  }

  private calculateBufferMinutesUsed(sessions: Session[]): number {
    return sessions.reduce((total, session) => {
      const normalCapacity = this.getSessionAvailableMinutes(
        session,
        'NORMAL_ONLY',
      );
      return total + Math.max(0, session.usedDuration - normalCapacity);
    }, 0);
  }

  private applyCarryForwardMetadata(
    item: PlanItem,
    targetSession: Session,
    targetSessionIndex: number,
    carriedForwardItemsByDay: Record<string, number>,
  ): PlanItem {
    const originalSessionOrder =
      item.originalSessionOrder ?? targetSessionIndex;
    const wasCarriedForward = originalSessionOrder < targetSessionIndex;

    if (!wasCarriedForward) {
      return {
        ...item,
        sessionId: targetSession.sessionId,
        originalSessionOrder,
      };
    }

    const dayKey = this.toDateKey(targetSession.sessionDate);
    carriedForwardItemsByDay[dayKey] =
      (carriedForwardItemsByDay[dayKey] ?? 0) + 1;

    return {
      ...item,
      sessionId: targetSession.sessionId,
      originalSessionId: item.originalSessionId ?? item.sessionId,
      originalSessionOrder,
      carriedForwardCount: (item.carriedForwardCount ?? 0) + 1,
    };
  }

  private async saveReplannedSessions(sessions: Session[]): Promise<void> {
    for (const session of sessions) {
      await this.sessionRepo.update(session.sessionId, {
        items: session.items,
        usedDuration: session.usedDuration,
      });

      for (const item of session.items) {
        await this.planItemRepo.update(item.planItemId, item);
      }
    }
  }

  private toDateKey(date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private canUpdatePlanItemStatus(
    currentStatus: PlanItemStatus,
    newStatus: PlanItemStatus,
  ): boolean {
    const allowedTransitions: Record<PlanItemStatus, PlanItemStatus[]> = {
      [PlanItemStatus.PLANNED]: [
        PlanItemStatus.COMPLETED,
        PlanItemStatus.POSTPONED,
        PlanItemStatus.CANCELLED,
      ],
      [PlanItemStatus.POSTPONED]: [PlanItemStatus.PLANNED],
      [PlanItemStatus.COMPLETED]: [],
      [PlanItemStatus.CANCELLED]: [PlanItemStatus.PLANNED],
    };

    return allowedTransitions[currentStatus].includes(newStatus);
  }

  private async verifyTeacherOwnsPlan(
    planId: string,
    teacherId: UserId,
  ): Promise<Plan> {
    const plan = await this.plansRepo.findById(planId);
    if (!plan) throw new NotFoundException();

    if (String(plan.teacherId) !== String(teacherId)) {
      throw new ForbiddenException('Teacher does not own this plan.');
    }

    return plan;
  }

  private async logPlanItemUpdate(
    item: PlanItem,
    actionType: PlanLogActionType,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.planLogsRepo.create({
      planLogId: `plan_log_${randomUUID()}`,
      planId: item.planId,
      sessionId: item.sessionId,
      planItemId: item.planItemId,
      curriculumItemId: item.curriculumItemId,
      actionType,
      description: this.buildPlanItemLogDescription(actionType, item, metadata),
      createdAt: new Date(),
      metadata: {
        ...metadata,
        status: item.status,
        estimatedTime: item.estimatedTime,
      },
    });
  }

  private async logPlanGenerated(plan: Plan): Promise<void> {
    await this.planLogsRepo.create({
      planLogId: `plan_log_${randomUUID()}`,
      planId: plan.planId,
      actionType: PlanLogActionType.PLAN_GENERATED,
      description: `Generated ${plan.planName}.`,
      createdAt: new Date(),
      metadata: {
        planName: plan.planName,
        subjectId: plan.subjectId,
        totalWeeks: plan.totalWeeks,
        sessionCount: plan.sessions.length,
        itemCount: plan.sessions.reduce(
          (total, session) => total + session.items.length,
          0,
        ),
      },
    });
  }

  private async logPlanReplanned(
    plan: Plan,
    fromSessionId: string,
    pace: ReplanPaceSummary,
    unplacedItems: PlanItem[],
  ): Promise<void> {
    const movedItemsCount = Object.values(pace.carriedForwardItemsByDay).reduce(
      (total, count) => total + count,
      0,
    );

    await this.planLogsRepo.create({
      planLogId: `plan_log_${randomUUID()}`,
      planId: plan.planId,
      sessionId: fromSessionId,
      actionType: PlanLogActionType.PLAN_REGENERATED,
      description: `Replanned ${plan.planName} from session ${fromSessionId}. Moved ${movedItemsCount} item(s).`,
      createdAt: new Date(),
      metadata: {
        fromSessionId,
        movedItemsCount,
        behindPace: pace.behindPace,
        carriedForwardItemsByDay: pace.carriedForwardItemsByDay,
        planOverCapacity: unplacedItems.length > 0,
        unplacedItemIds: unplacedItems.map((item) => item.planItemId),
      },
    });
  }

  private getPlanLogActionForStatus(status: PlanItemStatus): PlanLogActionType {
    switch (status) {
      case PlanItemStatus.COMPLETED:
        return PlanLogActionType.ITEM_COMPLETED;
      case PlanItemStatus.POSTPONED:
        return PlanLogActionType.ITEM_POSTPONED;
      case PlanItemStatus.CANCELLED:
        return PlanLogActionType.ITEM_CANCELLED;
      default:
        return PlanLogActionType.ITEM_REINSERTED;
    }
  } //comment :  do we actually need this method?

  private buildPlanItemLogDescription(
    actionType: PlanLogActionType,
    item: PlanItem,
    metadata: Record<string, unknown>,
  ): string {
    switch (actionType) {
      case PlanLogActionType.ITEM_TIME_UPDATED:
        return `Updated "${item.title}" duration from ${metadata.oldEstimatedTime} min to ${metadata.newEstimatedTime} min.`;
      case PlanLogActionType.ITEM_COMPLETED:
        return `Marked "${item.title}" as completed.`;
      case PlanLogActionType.ITEM_POSTPONED:
        return `Postponed "${item.title}".`;
      case PlanLogActionType.ITEM_CANCELLED:
        return `Cancelled "${item.title}".`;
      case PlanLogActionType.ITEM_REINSERTED:
        return `Reinserted "${item.title}" into the plan.`;
      default:
        return `Updated "${item.title}".`;
    }
  }

  private findSessionInPlan(plan: Plan, sessionId: string): Session {
    const session = plan.sessions.find(
      (session) => session.sessionId === sessionId,
    );
    if (!session) throw new NotFoundException();

    return session;
  }

  private findItemInSession(session: Session, planItemId: string): PlanItem {
    const item = session.items.find((item) => item.planItemId === planItemId);
    if (!item) throw new NotFoundException();

    return item;
  }

  private replaceItemInSession(session: Session, updatedItem: PlanItem): void {
    session.items = session.items.map((item) =>
      item.planItemId === updatedItem.planItemId ? updatedItem : item,
    );
  }

  private calculateSessionUsedDuration(session: Session): number {
    return session.items
      .filter(
        (item) =>
          item.status !== PlanItemStatus.CANCELLED &&
          item.status !== PlanItemStatus.POSTPONED,
      )
      .reduce((total, item) => total + Number(item.estimatedTime ?? 0), 0);
  }

  private calculatePlanProgress(plan: Plan): PlanProgressSummary {
    const items = plan.sessions.flatMap((session) => session.items);
    const cancelledItems = items.filter(
      (item) => item.status === PlanItemStatus.CANCELLED,
    ).length;
    const activeItems = items.filter(
      (item) => item.status !== PlanItemStatus.CANCELLED,
    );
    const completedItems = activeItems.filter(
      (item) => item.status === PlanItemStatus.COMPLETED,
    ).length;
    const totalItems = activeItems.length;
    const remainingItems = totalItems - completedItems;
    const progressPercentage =
      totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    return {
      planId: plan.planId,
      totalItems,
      completedItems,
      remainingItems,
      cancelledItems,
      progressPercentage,
    };
  }

  private calculatePlanMonitoringSummary(plan: Plan): PlanMonitoringSummary {
    //comment : we can use this one dorectly
    const progress = this.calculatePlanProgress(plan);
    const expectedCompletedMinutes =
      this.calculateExpectedCompletedMinutes(plan);
    const actualCompletedMinutes = this.calculateActualCompletedMinutes(plan);
    const classSpeedPercentage =
      expectedCompletedMinutes === 0
        ? 100
        : Math.round((actualCompletedMinutes / expectedCompletedMinutes) * 100);
    const overloadedSessions = plan.sessions.filter((session) => {
      const normalCapacity = this.getSessionAvailableMinutes(
        session,
        'NORMAL_ONLY',
      );
      const hasPendingItems = session.items.some(
        (item) => item.status === PlanItemStatus.PLANNED,
      );

      return (
        session.usedDuration > normalCapacity &&
        hasPendingItems
      );
    }).length;
    const reorderReasons: PlanReorderReason[] = [];

    if (classSpeedPercentage < 85) {
      reorderReasons.push('PROGRESS_BEHIND');
    }
    if (overloadedSessions > 0) {
      reorderReasons.push('SESSION_OVERFLOW');
    }

    const bufferMinutesUsed = this.calculateBufferMinutesUsed(plan.sessions);
    const compressedItems = this.collectCompressedItems(plan);

    return {
      ...progress,
      classSpeedPercentage,
      expectedCompletedMinutes,
      actualCompletedMinutes,
      planNeedsReordering: reorderReasons.length > 0,
      reorderReasons,
      postponedItems: this.collectArchivedItems(plan, PlanItemStatus.POSTPONED),
      cancelledItemsArchive: this.collectArchivedItems(
        plan,
        PlanItemStatus.CANCELLED,
      ),
      overloadedSessions,
      pace: this.calculateCurrentPace(plan),
      bufferUsed: bufferMinutesUsed > 0,
      bufferMinutesUsed,
      compressionApplied: compressedItems.length > 0,
      compressedItems,
    };
  }

  private calculateExpectedCompletedMinutes(plan: Plan): number {
    const progressWindow = this.getPlanProgressWindow(plan);
    return plan.sessions
      .filter((session) => {
        const sessionTime = new Date(session.sessionDate).getTime();
        return (
          sessionTime >= progressWindow.planCreatedDayStart.getTime() &&
          sessionTime < progressWindow.todayStart.getTime()
        );
      })
      .flatMap((session) => session.items)
      .filter((item) => item.status !== PlanItemStatus.CANCELLED)
      .reduce(
        (total, item) =>
          total + Number(item.originalEstimatedTime ?? item.estimatedTime ?? 0),
        0,
      );
  }

  private calculateActualCompletedMinutes(plan: Plan): number {
    const progressWindow = this.getPlanProgressWindow(plan);
    return plan.sessions
      .filter((session) => {
        const sessionTime = new Date(session.sessionDate).getTime();
        return (
          sessionTime >= progressWindow.planCreatedDayStart.getTime() &&
          sessionTime <= progressWindow.todayEnd.getTime()
        );
      })
      .flatMap((session) => session.items)
      .filter((item) => item.status === PlanItemStatus.COMPLETED)
      .reduce(
        (total, item) =>
          total + Number(item.originalEstimatedTime ?? item.estimatedTime ?? 0),
        0,
      );
  }

  private getPlanProgressWindow(plan: Plan): {
    planCreatedDayStart: Date;
    todayStart: Date;
    todayEnd: Date;
  } {
    const planCreatedAt = new Date(this.getPlanCreatedTimestamp(plan));
    const planCreatedDayStart = new Date(planCreatedAt); //comment:  whats the diff between these 2 variables ?
    planCreatedDayStart.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    return {
      planCreatedDayStart,
      todayStart,
      todayEnd,
    };
  }

  private collectArchivedItems(
    plan: Plan,
    status: PlanItemStatus,
  ): PlanArchiveItem[] {
    return plan.sessions.flatMap((session) =>
      session.items
        .filter((item) => item.status === status)
        .map((item) => ({
          planItemId: item.planItemId,
          title: item.title,
          status: item.status,
          estimatedTime: Number(item.estimatedTime ?? 0),
          notes: item.notes,
          sessionId: session.sessionId,
          sessionDate: session.sessionDate,
          sessionWeekNo: session.sessionWeekNo,
          day: session.day,
        })),
    );
  }

  private collectCompressedItems(plan: Plan): CompressedPlanItemSummary[] {
    //comment: here we just check if the time now is less than before, a better mechanisim will be to label compressed items as compressed
    return plan.sessions.flatMap((session) =>
      session.items
        .filter((item) => {
          const originalEstimatedTime = Number(
            item.originalEstimatedTime ?? item.estimatedTime ?? 0,
          );
          const estimatedTime = Number(item.estimatedTime ?? 0);
          return estimatedTime < originalEstimatedTime;
        })
        .map((item) => ({
          planItemId: item.planItemId,
          title: item.title,
          priority: item.priority ?? PlanItemPriority.LOW,
          oldEstimatedTime: Number(
            item.originalEstimatedTime ?? item.estimatedTime ?? 0,
          ),
          newEstimatedTime: Number(item.estimatedTime ?? 0),
        })),
    );
  }

  private calculateCurrentPace(plan: Plan): ReplanPaceSummary {
    const carriedForwardItemsByDay: Record<string, number> = {};

    plan.sessions.forEach((session) => {
      session.items.forEach((item) => {
        if ((item.carriedForwardCount ?? 0) > 0) {
          const dayKey = this.toDateKey(session.sessionDate);
          carriedForwardItemsByDay[dayKey] =
            (carriedForwardItemsByDay[dayKey] ?? 0) + 1;
        }
      });
    });

    return {
      carriedForwardItemsByDay,
      behindPace: Object.values(carriedForwardItemsByDay).some(
        (count) => count > 1,
      ),
    };
  }

  private isSameDate(left: Date, right: Date): boolean {
    const leftDate = new Date(left);
    const rightDate = new Date(right);

    return (
      leftDate.getFullYear() === rightDate.getFullYear() &&
      leftDate.getMonth() === rightDate.getMonth() &&
      leftDate.getDate() === rightDate.getDate()
    );
  }

  private getDateTime(date: Date): number {
    return new Date(date).getTime();
  }

  private sortCurriculumItems(
    curriculumItems: CurriculumItem[],
  ): CurriculumItem[] {
    return [...curriculumItems].sort((a, b) => {
      if (a.unitNo !== b.unitNo) {
        return a.unitNo - b.unitNo;
      }

      if (a.lessonNo !== b.lessonNo) {
        return a.lessonNo - b.lessonNo;
      }

      return a.orderInLesson - b.orderInLesson;
    });
  }

  private async calculateSkillWeight(
    curriculumItem: CurriculumItem,
  ): Promise<number> {
    const priorityRows = await this.statService.sortWeakestSkills();

    const matchedSkill = priorityRows.find(
      (row) => curriculumItem.skillsSupported.includes(row.skillId), //need this to be fixed
    );

    const priorityPoints = matchedSkill
      ? priorityToPoints[matchedSkill.priority]
      : 0;

    const difficultyToPoints: Record<number, number> = {
      1: 3,
      2: 6,
      3: 10,
    };

    const difficultyPoints =
      difficultyToPoints[curriculumItem.difficulity] ?? 0;

    return priorityPoints + difficultyPoints;
  }

  private async calculatePlanItemPriority(
    curriculumItem: CurriculumItem,
  ): Promise<PlanItemPriority> {
    const priorityRows = await this.statService.sortWeakestSkills();
    const matchedSkill = priorityRows.find((row) =>
      curriculumItem.skillsSupported.includes(row.skillId),
    );

    switch (matchedSkill?.priority) {
      case Priority.HIGH:
        return PlanItemPriority.HIGH;
      case Priority.MID:
        return PlanItemPriority.MID;
      default:
        return PlanItemPriority.LOW;
    }
  }

  private getPlanItemCompressionSettings(
    estimatedTime: number,
    priority: PlanItemPriority,
  ): Pick<
    PlanItem,
    'originalEstimatedTime' | 'minEstimatedTime' | 'priority' | 'isCompressible'
  > {
    if (priority === PlanItemPriority.HIGH) {
      return {
        originalEstimatedTime: estimatedTime,
        minEstimatedTime: estimatedTime,
        priority,
        isCompressible: false,
      };
    }

    if (priority === PlanItemPriority.MID) {
      return {
        originalEstimatedTime: estimatedTime,
        minEstimatedTime: Math.max(6, estimatedTime - 3),
        priority,
        isCompressible: estimatedTime > 6,
      };
    }

    return {
      originalEstimatedTime: estimatedTime,
      minEstimatedTime: Math.max(3, estimatedTime - 6),
      priority,
      isCompressible: estimatedTime > 3,
    };
  }

  private weightToMinutes(weight: number): number {
    if (weight >= 18) return 15;
    if (weight >= 14) return 12;
    if (weight >= 10) return 9;
    return 6;
  }

  private async calculateEstimatedTime(
    curriculumItem: CurriculumItem,
  ): Promise<CurriculumItem> {
    const weight = await this.calculateSkillWeight(curriculumItem);
    const minutes = this.weightToMinutes(weight);

    return {
      ...curriculumItem,
      estimatedTime: minutes,
    };
  }

  private async findSubjectOffering(
    teacherId: UserId,
    subjectId: SubjectId,
  ): Promise<SubjectOffering> {
    const offerings = await this.subjectOfferingsRepo.findAll();
    const subjectOffering = offerings.find(
      (offering) =>
        String(offering.teacherId) === String(teacherId) &&
        String(offering.subjectId) === String(subjectId),
    );

    if (!subjectOffering) {
      throw new NotFoundException(
        'No subject offering found for this teacher and subject.',
      );
    }

    return subjectOffering;
  }

  private sortWeeklySlots(slots: WeeklySlotDTO[]): WeeklySlotDTO[] {
    return [...slots].sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      if (dayDiff !== 0) {
        return dayDiff;
      }

      return a.slotNumber - b.slotNumber;
    });
  }

  private async buildSessionsFromSlots(
    teacherId: UserId,
    subjectId: SubjectId,
    weeklySlots: WeeklySlotDTO[],
    timedItems: CurriculumItem[],
    totalWeeks: number,
    planId: string,
  ): Promise<Session[]> {
    if (weeklySlots.length === 0 || timedItems.length === 0) {
      return [];
    }

    const sessions: Session[] = [];
    let itemIndex = 0;

    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
      for (const slot of weeklySlots) {
        if (itemIndex >= timedItems.length) {
          return sessions;
        }

        const sessionId = `session_${teacherId}_${subjectId}_${weekIndex + 1}_${slot.day}_${slot.slotNumber}`;
        const sessionNumber = sessions.length + 1;
        const reviewBufferMinutes =
          sessionNumber % REVIEW_BUFFER_INTERVAL === 0
            ? REVIEW_BUFFER_MINUTES
            : 0;
        const availableMinutes =
          DEFAULT_SESSION_DURATION_MINUTES - reviewBufferMinutes;
        const itemsForSession: PlanItem[] = [];
        let usedDuration = 0;

        while (itemIndex < timedItems.length) {
          const currentItem = timedItems[itemIndex];
          const planItemPriority =
            await this.calculatePlanItemPriority(currentItem);
          const compressionSettings = this.getPlanItemCompressionSettings(
            Number(currentItem.estimatedTime ?? 0),
            planItemPriority,
          );
          const planItem: PlanItem = {
            ...currentItem,
            planId,
            sessionId,
            planItemId: `plan_item_${randomUUID()}`,
            title: currentItem.name,
            ...compressionSettings,
            status: PlanItemStatus.PLANNED,
          };
          const itemMinutes = Number(planItem.estimatedTime ?? 0);

          if (
            itemsForSession.length > 0 &&
            usedDuration + itemMinutes > availableMinutes
          ) {
            break;
          }

          if (itemsForSession.length === 0 && itemMinutes > availableMinutes) {
            itemsForSession.push(planItem);
            usedDuration += itemMinutes;
            itemIndex++;
            break;
          }

          itemsForSession.push(planItem);
          usedDuration += itemMinutes;
          itemIndex++;
        }

        sessions.push({
          sessionId,
          teacherId: String(teacherId),
          subjectId: String(subjectId),
          day: slot.day,
          items: itemsForSession,
          maxDuration: DEFAULT_SESSION_DURATION_MINUTES,
          usedDuration,
          reviewBufferMinutes,
          slotNumber: slot.slotNumber,
          sessionDate: this.buildSessionDate(slot.day, weekIndex),
          sessionWeekNo: weekIndex + 1,
        });
      }
    }

    return sessions;
  }

  private buildSessionDate(day: WeekDay, weekIndex: number): Date {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const dayOffset = DAY_ORDER.indexOf(day);
    const sessionDate = new Date(startOfWeek);
    sessionDate.setDate(startOfWeek.getDate() + weekIndex * 7 + dayOffset);
    return sessionDate;
  }

  private getPlanCreatedTimestamp(plan: Plan): number {
    const planIdParts = String(plan.planId).split('_');
    const rawTimestamp = Number(planIdParts[planIdParts.length - 1]);

    if (!Number.isNaN(rawTimestamp) && rawTimestamp > 0) {
      return rawTimestamp;
    }

    return new Date(plan.startDate).getTime();
  }
}
