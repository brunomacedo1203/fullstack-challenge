import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'E-mail cadastrado' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strongPass1', description: 'Senha do usuário', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
