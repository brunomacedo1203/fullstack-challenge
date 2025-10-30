import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { Task } from './task.entity';

@Entity({ name: 'task_assignees' })
@Unique(['taskId', 'userId'])
export class TaskAssignee {
  @PrimaryColumn('uuid', { name: 'task_id' })
  taskId!: string;

  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;
}
