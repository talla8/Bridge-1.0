import { Column, Entity, PrimaryColumn } from 'typeorm';
import { PlanItemPriority, PlanItemStatus } from 'src/domain/plan-item';

@Entity({ name: 'plan_items' })
export class PlanItemEntity {
  @PrimaryColumn({ name: 'plan_item_id', type: 'text' })
  planItemId: string;

  @Column({ name: 'plan_id', type: 'text' })
  planId: string;

  @Column({ name: 'session_id', type: 'text' })
  sessionId: string;

  @Column({ name: 'curriculum_item_id', type: 'text' })
  curriculumItemId: string;

  @Column({ name: 'subject_id', type: 'text' })
  subjectId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'unit_no', type: 'integer' })
  unitNo: number;

  @Column({ name: 'lesson_no', type: 'integer' })
  lessonNo: number;

  @Column({ name: 'order_in_lesson', type: 'integer' })
  orderInLesson: number;

  @Column({ name: 'estimated_time', type: 'integer' })
  estimatedTime: number;

  @Column({ name: 'original_estimated_time', type: 'integer', nullable: true })
  originalEstimatedTime?: number;

  @Column({ name: 'min_estimated_time', type: 'integer', nullable: true })
  minEstimatedTime?: number;

  @Column({ type: 'text', nullable: true })
  priority?: PlanItemPriority;

  @Column({ name: 'is_compressible', type: 'boolean', nullable: true })
  isCompressible?: boolean;

  @Column({ type: 'text' })
  status: PlanItemStatus;

  @Column({ name: 'original_session_id', type: 'text', nullable: true })
  originalSessionId?: string;

  @Column({ name: 'original_session_order', type: 'integer', nullable: true })
  originalSessionOrder?: number;

  @Column({ name: 'carried_forward_count', type: 'integer', nullable: true })
  carriedForwardCount?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
