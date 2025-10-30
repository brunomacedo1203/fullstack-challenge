import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Task } from './task.entity';

export enum TaskHistoryEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
}

@Entity({ name: 'task_history' })
@Index(['taskId', 'createdAt'])
export class TaskHistory {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'task_id' })
  taskId!: string;

  @Column('uuid', { name: 'actor_id', nullable: true })
  actorId?: string | null;

  @Column({ type: 'enum', enum: TaskHistoryEventType, enumName: 'task_history_event_type' })
  type!: TaskHistoryEventType;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Task, (task) => task.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @BeforeInsert()
  assignId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
