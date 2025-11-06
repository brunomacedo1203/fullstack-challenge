import React, { useMemo } from 'react';
import { useAuthStore } from '../features/auth/store';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { listTasks } from '../features/tasks/tasks.api';
import { useNotificationsStore } from '../features/notifications/store';
import { Link } from '@tanstack/react-router';
import { Bell, Clock, AlertCircle, MessageSquare, TrendingUp } from 'lucide-react';

export const HomePage: React.FC = () => {
  useAuthGuard();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationsStore((s) => s.items);
  const unreadCount = notifications.length;

  const { data } = useQuery({
    queryKey: ['home_tasks_preview'],
    queryFn: () => listTasks({ page: 1, size: 100 }),
    staleTime: 30_000,
  });

  const subtitle = useMemo(() => {
    const tasks = data?.data ?? [];
    const today = new Date();
    const isSameDay = (iso?: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    const pendingToday = tasks.filter(
      (t) =>
        (t.status === 'TODO' || t.status === 'IN_PROGRESS') && isSameDay(t.dueDate ?? undefined),
    ).length;

    if (unreadCount > 0) {
      return `${unreadCount} nova${unreadCount > 1 ? 's' : ''} notificaç${unreadCount > 1 ? 'ões' : 'ão'} desde sua última visita`;
    }
    if (pendingToday > 0) {
      return `Você tem ${pendingToday} tarefa${pendingToday > 1 ? 's' : ''} pendente${
        pendingToday > 1 ? 's' : ''
      } hoje`;
    }
    return 'Tudo em dia!';
  }, [data, unreadCount]);

  const counters = useMemo(() => {
    const tasks = data?.data ?? [];
    return tasks.reduce(
      (acc, t) => {
        if (t.status === 'TODO') acc.todo += 1;
        if (t.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (t.status === 'DONE') acc.done += 1;
        return acc;
      },
      { todo: 0, inProgress: 0, done: 0 },
    );
  }, [data]);

  const urgentTasks = useMemo(() => {
    const tasks = data?.data ?? [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks
      .filter((t) => {
        if (t.status === 'DONE') return false;
        if (t.priority === 'URGENT') return true;
        if (t.priority === 'HIGH' && t.dueDate) {
          const due = new Date(t.dueDate);
          return due <= tomorrow;
        }
        return false;
      })
      .slice(0, 3);
  }, [data]);

  const recentActivity = useMemo(() => {
    // Combina notificações com data/hora
    return notifications.slice(0, 5).map((n) => ({
      message: n.body || n.title || 'Notificação', // Corrigido: usar body ou title em vez de message
      time: n.createdAt || new Date().toISOString(),
    }));
  }, [notifications]);

  const getRelativeTime = (isoDate: string) => {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-blue-500';
      default:
        return 'text-foreground/70';
    }
  };

  const formatDueDate = (dueDate?: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Atrasada';
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    return `${diffDays} dias`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-gaming font-bold text-primary mb-4">
          Bem-vindo(a){user ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-foreground/70 text-lg">{subtitle}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 transition-colors">
          <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium mb-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> TODO
          </div>
          <div className="text-3xl font-bold text-foreground">{counters.todo}</div>
        </div>
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 transition-colors">
          <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium mb-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-accent" /> IN PROGRESS
          </div>
          <div className="text-3xl font-bold text-foreground">{counters.inProgress}</div>
        </div>
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 transition-colors">
          <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium mb-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-secondary" /> DONE
          </div>
          <div className="text-3xl font-bold text-foreground">{counters.done}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-gaming font-bold text-foreground">Atividade Recente</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                >
                  <Bell className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 line-clamp-2">{activity.message}</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      {getRelativeTime(activity.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/50">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          )}
        </div>

        {/* Tarefas Urgentes */}
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-gaming font-bold text-foreground">Requer Atenção</h2>
            {urgentTasks.length > 0 && (
              <span className="ml-auto text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full font-medium">
                {urgentTasks.length}
              </span>
            )}
          </div>
          {urgentTasks.length > 0 ? (
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <Link
                  key={task.id}
                  to="/tasks/$id" // Corrigido: usar $id em vez de $taskId
                  params={{ id: task.id }} // Corrigido: usar id em vez de taskId
                  className="block p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${getPriorityColor(task.priority)}`}>●</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-foreground/50 uppercase">
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-foreground/50">
                            <Clock className="w-3 h-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/50">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tarefa urgente</p>
              <p className="text-xs mt-1">Continue assim! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-8 text-center">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Ver Todas as Tarefas
        </Link>
      </div>
    </div>
  );
};
