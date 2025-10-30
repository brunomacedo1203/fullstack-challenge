import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { TaskPriorityDto, TaskStatusDto } from './create-task.dto';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Atualizar documentação do projeto',
    description: 'Novo título da tarefa (1 a 255 caracteres)',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Corrigir exemplos e detalhar endpoints no README',
    description: 'Nova descrição detalhada da tarefa',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2025-11-20', description: 'Nova data (ISO YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: TaskPriorityDto,
    description: 'Nova prioridade: LOW, MEDIUM, HIGH, URGENT',
  })
  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @ApiPropertyOptional({
    enum: TaskStatusDto,
    description: 'Novo status: TODO, IN_PROGRESS, REVIEW, DONE',
  })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['b4b62e4a-b431-49e1-b3e2-ccdbcb986b6c'],
    description: 'Lista nova de IDs (UUID v4) dos usuários atribuídos',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}
