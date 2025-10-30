import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implementar autenticação JWT',
    description: 'Título da tarefa',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'Desenvolver o fluxo de login e refresh token',
    description: 'Descrição detalhada da tarefa',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-11-15',
    description: 'Prazo da tarefa (formato ISO)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    enum: TaskPriority,
    example: TaskPriority.HIGH,
    description: 'Prioridade da tarefa',
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.TODO,
    description: 'Status atual da tarefa',
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    example: ['cbb6c8c3-3e5d-4b8e-b9d7-6aafc4aab0b3'],
    description: 'Lista de IDs de usuários atribuídos',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}
