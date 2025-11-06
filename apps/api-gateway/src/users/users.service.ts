import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

@Injectable()
export class UsersProxyService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3002');
  }

  async list(authorization?: string): Promise<unknown> {
    return this.forward('get', '/users', { authorization });
  }

  private async forward(
    method: 'get',
    path: string,
    options: { authorization?: string },
  ): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (options.authorization) {
      headers.Authorization = options.authorization;
    }

    try {
      const request$ = this.http.request({
        method,
        url: `${this.baseUrl}${path}`,
        headers: Object.keys(headers).length ? headers : undefined,
      });

      const { data } = await firstValueFrom(request$);
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
