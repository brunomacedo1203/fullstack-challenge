import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListNotificationsQueryDto {
  // recipientId now derived from JWT; query param kept optional for backward-compatibility but ignored
  @ApiPropertyOptional({ description: 'Deprecated: ignored. Recipient is derived from JWT.' })
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({
    description: 'Items to return (1-100). Default 10',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;
}
