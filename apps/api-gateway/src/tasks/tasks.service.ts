import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TasksProxyService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('TASKS_SERVICE_URL', 'http://tasks-service:3003');
  }

  list(params: Record<string, unknown>, authorization?: string): Promise<unknown> {
    return this.forward('get', '/tasks', { params, authorization });
  }

  getById(id: string, authorization?: string): Promise<unknown> {
    return this.forward('get', `/tasks/${id}`, { authorization });
  }

  create(body: unknown, authorization?: string): Promise<unknown> {
    return this.forward('post', '/tasks', { body, authorization });
  }

  update(id: string, body: unknown, authorization?: string): Promise<unknown> {
    return this.forward('put', `/tasks/${id}`, { body, authorization });
  }

  delete(id: string, authorization?: string): Promise<unknown> {
    return this.forward('delete', `/tasks/${id}`, { authorization });
  }

  private async forward(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    options: { params?: Record<string, unknown>; body?: unknown; authorization?: string },
  ): Promise<unknown> {
    const headers = options.authorization ? { Authorization: options.authorization } : undefined;

    try {
      const request$ = this.http.request({
        method,
        url: `${this.baseUrl}${path}`,
        data: options.body,
        params: options.params,
        headers,
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

    throw new InternalServerErrorException('Tasks service is unavailable');
  }
}
