import api from '../../lib/api';

export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; username: string; password: string };

export type TokensResponse = { accessToken: string; refreshToken: string };

export async function login(input: LoginInput): Promise<TokensResponse> {
  const { data } = await api.post<TokensResponse>('/auth/login', input);
  return data;
}

export async function register(input: RegisterInput): Promise<TokensResponse> {
  const { data } = await api.post<TokensResponse>('/auth/register', input);
  return data;
}
