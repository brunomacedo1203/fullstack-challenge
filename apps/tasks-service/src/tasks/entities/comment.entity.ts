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

@Entity({ name: 'comments' })
@Index(['taskId', 'createdAt'])
export class Comment {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'task_id' })
  taskId!: string;

  @Column('uuid', { name: 'author_id', nullable: true })
  authorId?: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @BeforeInsert()
  assignId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
