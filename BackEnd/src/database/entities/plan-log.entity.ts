import { Column, Entity, PrimaryColumn } from 'typeorm';
import { PlanLogActionType } from 'src/domain/planLog';

@Entity({ name: 'plan_logs' })
export class PlanLogEntity {
  @PrimaryColumn({ name: 'plan_log_id', type: 'text' })
  planLogId: string;

  @Column({ name: 'plan_id', type: 'text' })
  planId: string;

  @Column({ name: 'session_id', type: 'text', nullable: true })
  sessionId?: string;

  @Column({ name: 'plan_item_id', type: 'text', nullable: true })
  planItemId?: string;

  @Column({ name: 'curriculum_item_id', type: 'text', nullable: true })
  curriculumItemId?: string;

  @Column({ name: 'action_type', type: 'text' })
  actionType: PlanLogActionType;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'metadata_json', type: 'text', nullable: true })
  metadataJson?: string | null;
}
