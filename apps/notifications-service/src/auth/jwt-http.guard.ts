import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtHttpAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    // Align secret with API Gateway access token
    this.secret = configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] as string | undefined;
    const token = this.extractBearer(header);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const payload = jwt.verify(token, this.secret) as Record<string, unknown>;
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractBearer(header?: string): string | undefined {
    if (!header) return undefined;
    const [scheme, token] = header.split(' ');
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
    return token;
  }
}
