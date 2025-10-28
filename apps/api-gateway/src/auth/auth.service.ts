import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthProxyService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3002');
  }

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    return this.forward<AuthTokensDto>('register', dto);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    return this.forward<AuthTokensDto>('login', dto);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.forward<AuthTokensDto>('refresh', dto);
  }

  private async forward<T>(path: string, payload: unknown): Promise<T> {
    try {
      const { data } = await firstValueFrom(this.http.post<T>(`${this.baseUrl}/${path}`, payload));
      return data;
    } catch (error) {
      this.rethrowAxiosError(error);
    }
  }

  private rethrowAxiosError(error: unknown): never {
    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      throw new HttpException(data ?? error.message, status);
    }

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException('Auth service is unavailable');
  }
}
