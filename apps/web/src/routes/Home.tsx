import React from 'react';
import { useAuthStore } from '../features/auth/store';
import { useAuthGuard } from '../hooks/useAuthGuard';

export const HomePage: React.FC = () => {
  useAuthGuard();
  const user = useAuthStore((s) => s.user);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Bem-vindo(a){user ? `, ${user.username}` : ''}!</h1>
      <p className="text-gray-600 mt-2">Você está autenticado. Em breve: lista de tarefas.</p>
    </div>
  );
};
