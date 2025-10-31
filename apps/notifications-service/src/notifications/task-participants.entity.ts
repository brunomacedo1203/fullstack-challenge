import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'task_participants' })
export class TaskParticipants {
  @PrimaryColumn({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'creator_id', type: 'uuid', nullable: true })
  creatorId?: string | null;

  @Column({ name: 'assignee_ids', type: 'uuid', array: true, default: () => "'{}'::uuid[]" })
  assigneeIds!: string[];
}
