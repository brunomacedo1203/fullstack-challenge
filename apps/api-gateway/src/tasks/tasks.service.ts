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

  list(params: unknown, authorization?: string, userId?: string): Promise<unknown> {
    return this.forward('get', '/tasks', { params, authorization, userId });
  }

  getById(id: string, authorization?: string, userId?: string): Promise<unknown> {
    return this.forward('get', `/tasks/${id}`, { authorization, userId });
  }

  create(body: unknown, authorization?: string, userId?: string): Promise<unknown> {
    return this.forward('post', '/tasks', { body, authorization, userId });
  }

  update(id: string, body: unknown, authorization?: string, userId?: string): Promise<unknown> {
    return this.forward('put', `/tasks/${id}`, { body, authorization, userId });
  }

  delete(id: string, authorization?: string, userId?: string): Promise<unknown> {
    return this.forward('delete', `/tasks/${id}`, { authorization, userId });
  }

  listComments(
    taskId: string,
    params: unknown,
    authorization?: string,
    userId?: string,
  ): Promise<unknown> {
    return this.forward('get', `/tasks/${taskId}/comments`, { params, authorization, userId });
  }

  createComment(
    taskId: string,
    body: unknown,
    authorization?: string,
    userId?: string,
  ): Promise<unknown> {
    return this.forward('post', `/tasks/${taskId}/comments`, { body, authorization, userId });
  }

  private async forward(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    options: { params?: unknown; body?: unknown; authorization?: string; userId?: string },
  ): Promise<unknown> {
    const headers: Record<string, string> = {};
    if (options.authorization) {
      headers.Authorization = options.authorization;
    }
    if (options.userId) {
      headers['X-User-Id'] = options.userId;
    }

    try {
      const request$ = this.http.request({
        method,
        url: `${this.baseUrl}${path}`,
        data: options.body,
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

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException('Tasks service is unavailable');
  }
}
