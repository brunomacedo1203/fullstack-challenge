import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh',
    description: 'Refresh token válido emitido pelo login ou refresh anterior',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
