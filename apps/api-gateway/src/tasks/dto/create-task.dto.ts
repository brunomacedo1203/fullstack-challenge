import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export enum TaskPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatusDto {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'Especificar Swagger no Gateway',
    description: 'Título da tarefa (1 a 255 caracteres)',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'Adicionar DTOs no Gateway para documentar bodies',
    description: 'Descrição detalhada da tarefa',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '2025-11-20',
    description: 'Data limite no formato ISO (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: TaskPriorityDto,
    example: TaskPriorityDto.MEDIUM,
    description: 'Prioridade da tarefa: LOW, MEDIUM, HIGH, URGENT',
  })
  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @ApiPropertyOptional({
    enum: TaskStatusDto,
    example: TaskStatusDto.TODO,
    description: 'Status inicial: TODO, IN_PROGRESS, REVIEW, DONE',
  })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['b4b62e4a-b431-49e1-b3e2-ccdbcb986b6c'],
    description: 'Lista de IDs (UUID v4) dos usuários atribuídos',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}
