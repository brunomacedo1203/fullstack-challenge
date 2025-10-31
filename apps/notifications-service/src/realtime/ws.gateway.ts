import { Inject, Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import type { Server as WSServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';

const LOGGER_CONTEXT = 'WsGateway';

export interface WsClient extends WebSocket {
  userId?: string;
}

@Injectable()
@WebSocketGateway({
  path: process.env.WS_PATH ?? '/ws',
})
export class WsGateway {
  @WebSocketServer() server!: WSServer;

  private readonly path: string;
  private readonly jwtSecret: string;

  // userId -> Set of sockets
  private readonly socketsByUser = new Map<string, Set<WsClient>>();

  constructor(
    @Inject(ConfigService) config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.path = config.get<string>('WS_PATH', '/ws');
    // Prefer the same secret used by the API gateway access token
    // Fallback to legacy JWT_SECRET for compatibility
    this.jwtSecret = config.get<string>(
      'JWT_ACCESS_SECRET',
      config.get<string>('JWT_SECRET', 'change-me-access'),
    );
  }

  afterInit(server: WSServer): void {
    // Wire listeners on the raw ws server
    server.on('connection', (socket: WsClient, req: IncomingMessage) => {
      try {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`);
        if (url.pathname !== this.path) {
          socket.close(4003, 'Invalid path');
          return;
        }
        const token =
          url.searchParams.get('token') ?? this.extractBearer(req.headers['authorization']);
        if (!token) {
          socket.close(4001, 'Missing token');
          return;
        }
        const payload = jwt.verify(token, this.jwtSecret) as { sub?: string };
        const userId = payload.sub;
        if (!userId) {
          socket.close(4002, 'Invalid token');
          return;
        }
        socket.userId = userId;
        this.trackSocket(userId, socket);

        // Send recent unread notifications on connect (best-effort)
        this.notifications
          .listUnread(userId, 10)
          .then((items) => {
            for (const item of items) {
              this.sendToSocket(socket, 'notification:unread', {
                id: item.id,
                type: item.type,
                taskId: item.taskId,
                commentId: item.commentId,
                title: item.title,
                body: item.body,
                createdAt: item.createdAt,
              });
            }
          })
          .catch((err) =>
            Logger.warn(`Failed to fetch unread for ${userId}: ${String(err)}`, LOGGER_CONTEXT),
          );

        socket.on('close', () => this.untrackSocket(userId, socket));
        socket.on('error', (err) =>
          Logger.warn(`WS error for ${userId}: ${String(err)}`, LOGGER_CONTEXT),
        );
      } catch (error) {
        Logger.warn(`WS connection rejected: ${(error as Error).message}`, LOGGER_CONTEXT);
        try {
          socket.close(4000, 'Unauthorized');
        } catch {}
      }
    });

    Logger.log(`WS initialized on path ${this.path}`, LOGGER_CONTEXT);
  }

  emitToUsers(event: string, data: unknown, userIds: string[]): void {
    const payload = JSON.stringify({ event, data });
    for (const userId of userIds) {
      const sockets = this.socketsByUser.get(userId);
      if (!sockets) continue;
      for (const socket of sockets) {
        try {
          socket.send(payload);
        } catch (error) {
          Logger.warn(`Failed to send to ${userId}: ${(error as Error).message}`, LOGGER_CONTEXT);
        }
      }
    }
  }

  private sendToSocket(socket: WsClient, event: string, data: unknown): void {
    try {
      socket.send(JSON.stringify({ event, data }));
    } catch (error) {
      Logger.warn(`Failed to send to socket: ${(error as Error).message}`, LOGGER_CONTEXT);
    }
  }

  private extractBearer(header?: string): string | undefined {
    if (!header) return undefined;
    const [scheme, token] = header.split(' ');
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
    return token;
  }

  private trackSocket(userId: string, socket: WsClient): void {
    let set = this.socketsByUser.get(userId);
    if (!set) {
      set = new Set();
      this.socketsByUser.set(userId, set);
    }
    set.add(socket);
  }

  private untrackSocket(userId: string, socket: WsClient): void {
    const set = this.socketsByUser.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.socketsByUser.delete(userId);
  }
}
