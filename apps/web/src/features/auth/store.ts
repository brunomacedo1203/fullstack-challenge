import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
};

export type User = {
  id: string;
  email: string;
  username: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

type AuthActions = {
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

function decodeUser(accessToken: string): User | null {
  try {
    const payload = jwtDecode<JwtPayload>(accessToken);
    return { id: payload.sub, email: payload.email, username: payload.username };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) =>
        set(() => ({ accessToken, refreshToken, user: decodeUser(accessToken) })),
      logout: () => set(() => ({ accessToken: null, refreshToken: null, user: null })),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
