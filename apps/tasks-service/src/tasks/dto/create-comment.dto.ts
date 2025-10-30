import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  @IsOptional()
  @IsUUID('4')
  authorId?: string;
}
