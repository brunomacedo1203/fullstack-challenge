import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export type UserSummary = {
  id: string;
  username: string;
  email: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(input: CreateUserInput): Promise<User> {
    // Rely on entity-level @BeforeInsert hook to assign UUID
    const entity = this.usersRepository.create({ ...input });
    return this.usersRepository.save(entity);
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.usersRepository.update({ id: userId }, { refreshTokenHash });
  }

  async findAllSummaries(): Promise<UserSummary[]> {
    const users = await this.usersRepository.find({
      select: {
        id: true,
        username: true,
        email: true,
      },
      order: { username: 'ASC' },
    });

    return users;
  }
}
