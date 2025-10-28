import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);

    if (existingByEmail) {
      throw new ConflictException('Email is already registered');
    }

    if (existingByUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.usersService.create({
        email: dto.email,
        username: dto.username,
        passwordHash,
      });

      return this.issueTokens(user);
    } catch (error: unknown) {
      const pgCode = (error as any)?.code ?? (error as any)?.driverError?.code;
      if (pgCode === '23505') {
        // Violação de constraint única (email/username)
        throw new ConflictException('Email or username already exists');
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, username: user.username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessTtl(),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshTtl(),
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, this.getBcryptSaltRounds());
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.getBcryptSaltRounds());
  }

  private getBcryptSaltRounds(): number {
    return Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'));
  }

  private getAccessSecret(): string {
    return this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access');
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret');
  }

  private getAccessTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_ACCESS_TTL') ??
      '15m') as JwtSignOptions['expiresIn'];
  }

  private getRefreshTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_REFRESH_TTL') ??
      '7d') as JwtSignOptions['expiresIn'];
  }
}
