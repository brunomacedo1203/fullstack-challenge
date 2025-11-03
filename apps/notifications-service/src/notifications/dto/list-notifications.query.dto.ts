import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiProperty({ description: 'Recipient user ID (UUID v4)' })
  @IsUUID('4')
  recipientId!: string;

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
