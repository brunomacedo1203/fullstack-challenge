import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsProxyService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>(
      'NOTIFICATIONS_SERVICE_URL',
      'http://notifications-service:3004',
    );
  }

  list(params: unknown, authorization?: string): Promise<unknown> {
    return this.forward('get', '/notifications', { params, authorization });
  }

  markRead(id: string, authorization?: string): Promise<unknown> {
    return this.forward('patch', `/notifications/${id}/read`, { authorization });
  }

  private async forward(
    method: 'get' | 'patch',
    path: string,
    options: { params?: unknown; authorization?: string },
  ): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (options.authorization) headers.Authorization = options.authorization;

    try {
      const request$ = this.http.request({
        method,
        url: `${this.baseUrl}${path}`,
        params: options.params,
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
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Notifications service is unavailable');
  }
}
