import api from '../../lib/api';

export type UserSummary = {
  id: string;
  username: string;
  email: string;
};

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>('/users');
  return data;
}
