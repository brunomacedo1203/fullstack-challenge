import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'E-mail válido e único' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'username123',
    description: 'Username único (letras, números, hífen ou underscore)',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_\-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username!: string;

  @ApiProperty({
    example: 'strongPass1',
    description: 'Senha com no mínimo 6 caracteres',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
