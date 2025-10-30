import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Precisamos revisar o texto de abertura',
    description: 'Conteúdo do comentário',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  @ApiPropertyOptional({
    example: 'b4b62e4a-b431-49e1-b3e2-ccdbcb986b6c',
    description:
      '(Opcional) ID do autor. Será sobrescrito pelo usuário autenticado quando disponível.',
  })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;
}
