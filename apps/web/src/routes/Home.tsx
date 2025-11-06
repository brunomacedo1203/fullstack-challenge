import React, { useMemo } from 'react';
import { useAuthStore } from '../features/auth/store';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { listTasks } from '../features/tasks/tasks.api';
import { listUsers } from '../features/users/users.api';
import { useNotificationsStore } from '../features/notifications/store';
import { Link } from '@tanstack/react-router';
import {
  Bell,
  Clock,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { getRelativeTime, isSameDayISO } from '../lib/time';
import { getPriorityColor, formatDueDate } from '../features/tasks/utils';

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

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const usersById = useMemo(() => {
    const m = new Map();
    for (const u of usersData ?? []) m.set(u.id, u);
    return m;
  }, [usersData]);

  // MELHORADO: Subtítulo mais contextual
  const subtitle = useMemo(() => {
    const tasks = data?.data ?? [];
    const today = new Date();
    const currentUserId = user?.id;

    const myTasksToday = tasks.filter(
      (t) =>
        t.assigneeIds.includes(currentUserId || '') &&
        (t.status === 'TODO' || t.status === 'IN_PROGRESS') &&
        isSameDayISO(t.dueDate ?? undefined, today),
    ).length;

    const completedThisWeek = tasks.filter((t) => {
      if (t.status !== 'DONE') return false;
      if (!t.updatedAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(t.updatedAt) >= weekAgo;
    }).length;

    if (unreadCount > 0) {
      return `${unreadCount} nova${unreadCount > 1 ? 's' : ''} notificaç${
        unreadCount > 1 ? 'ões' : 'ão'
      } desde sua última visita`;
    }
    if (myTasksToday > 0) {
      return `Você tem ${myTasksToday} tarefa${myTasksToday > 1 ? 's' : ''} atribuída${
        myTasksToday > 1 ? 's' : ''
      } para hoje`;
    }
    if (completedThisWeek > 0) {
      return `${completedThisWeek} tarefa${completedThisWeek > 1 ? 's concluídas' : ' concluída'} esta semana 🎉`;
    }
    return 'Tudo em dia! Hora de pegar novas tarefas 💪';
  }, [data, unreadCount, user?.id]);

  const counters = useMemo(() => {
    const tasks = data?.data ?? [];
    const currentUserId = user?.id;

    return tasks.reduce(
      (acc, t) => {
        // Total geral
        if (t.status === 'TODO') acc.todo += 1;
        if (t.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (t.status === 'DONE') acc.done += 1;

        // Minhas tarefas
        if (t.assigneeIds.includes(currentUserId || '')) {
          if (t.status === 'TODO') acc.myTodo += 1;
          if (t.status === 'IN_PROGRESS') acc.myInProgress += 1;
        }

        return acc;
      },
      { todo: 0, inProgress: 0, done: 0, myTodo: 0, myInProgress: 0 },
    );
  }, [data, user?.id]);

  const urgentTasks = useMemo(() => {
    const tasks = data?.data ?? [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentUserId = user?.id;

    return tasks
      .filter((t) => {
        if (t.status === 'DONE') return false;
        // MELHORADO: Priorizar tarefas atribuídas ao usuário
        const isMyTask = t.assigneeIds.includes(currentUserId || '');
        if (t.priority === 'URGENT') return true;
        if (t.priority === 'HIGH' && t.dueDate) {
          const due = new Date(t.dueDate);
          return due <= tomorrow;
        }
        // Incluir minhas tarefas que vencem hoje, mesmo que não sejam URGENT
        if (isMyTask && t.dueDate) {
          const due = new Date(t.dueDate);
          return isSameDayISO(t.dueDate, now);
        }
        return false;
      })
      .sort((a, b) => {
        // Minhas tarefas primeiro
        const aIsMine = a.assigneeIds.includes(currentUserId || '');
        const bIsMine = b.assigneeIds.includes(currentUserId || '');
        if (aIsMine && !bIsMine) return -1;
        if (!aIsMine && bIsMine) return 1;

        // Depois por prioridade
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }, [data, user?.id]);

  // NOVO: Atividade recente mais útil
  const recentActivity = useMemo(() => {
    const tasks = data?.data ?? [];
    const activities: Array<{ message: string; time: string; type: string }> = [];

    // Tarefas criadas nas últimas 24h
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    tasks
      .filter((t) => new Date(t.createdAt) >= dayAgo)
      .slice(0, 3)
      .forEach((t) => {
        activities.push({
          message: `Nova tarefa criada: ${t.title}`,
          time: t.createdAt,
          type: 'task_created',
        });
      });

    // Tarefas concluídas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks
      .filter((t) => t.status === 'DONE' && t.updatedAt && new Date(t.updatedAt) >= today)
      .slice(0, 3)
      .forEach((t) => {
        activities.push({
          message: `Tarefa concluída: ${t.title}`,
          time: t.updatedAt || t.createdAt,
          type: 'task_completed',
        });
      });

    // Adicionar notificações
    notifications.slice(0, 2).forEach((n) => {
      activities.push({
        message: n.body || n.title || 'Notificação',
        time: n.createdAt || new Date().toISOString(),
        type: 'notification',
      });
    });

    // Ordenar por data e pegar as 5 mais recentes
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [data, notifications]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-gaming font-bold text-primary mb-4">
          Bem-vindo(a){user ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-foreground/70 text-lg">{subtitle}</p>
      </div>

      {/* MELHORADO: Status Cards Clicáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/tasks"
          search={{ status: 'TODO' }}
          className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> TODO
            </div>
            {counters.myTodo > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {counters.myTodo} suas
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {counters.todo}
          </div>
          <p className="text-xs text-foreground/50 mt-2">Clique para filtrar</p>
        </Link>

        <Link
          to="/tasks"
          search={{ status: 'IN_PROGRESS' }}
          className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 hover:border-accent/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" /> EM ANDAMENTO
            </div>
            {counters.myInProgress > 0 && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                {counters.myInProgress} suas
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
            {counters.inProgress}
          </div>
          <p className="text-xs text-foreground/50 mt-2">Clique para filtrar</p>
        </Link>

        <Link
          to="/tasks"
          search={{ status: 'DONE' }}
          className="rounded-xl border-2 border-border bg-gaming-light/40 p-6 hover:bg-gaming-light/60 hover:border-secondary/50 transition-all group"
        >
          <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium mb-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-secondary" /> CONCLUÍDAS
          </div>
          <div className="text-3xl font-bold text-foreground group-hover:text-secondary transition-colors">
            {counters.done}
          </div>
          <p className="text-xs text-foreground/50 mt-2">Clique para filtrar</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MELHORADO: Atividade Recente */}
        <div className="rounded-xl border-2 border-border bg-gaming-light/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-gaming font-bold text-foreground">Atividade Recente</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => {
                const Icon =
                  activity.type === 'task_completed'
                    ? CheckCircle2
                    : activity.type === 'task_created'
                      ? ListTodo
                      : Bell;
                const iconColor =
                  activity.type === 'task_completed'
                    ? 'text-green-500'
                    : activity.type === 'task_created'
                      ? 'text-blue-500'
                      : 'text-primary';

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${iconColor} mt-1 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 line-clamp-2">{activity.message}</p>
                      <p className="text-xs text-foreground/50 mt-1">
                        {getRelativeTime(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/50">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          )}
        </div>

        {/* MELHORADO: Tarefas Urgentes com Responsáveis */}
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
              {urgentTasks.map((task) => {
                const isMyTask = task.assigneeIds.includes(user?.id || '');
                const assigneeNames = task.assigneeIds
                  .map((id) => usersById.get(id)?.username || id.slice(0, 8))
                  .slice(0, 2);

                return (
                  <Link
                    key={task.id}
                    to="/tasks/$id"
                    params={{ id: task.id }}
                    className="block p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors group border border-transparent hover:border-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-lg ${getPriorityColor(task.priority)}`}>●</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
                            {task.title}
                          </p>
                          {isMyTask && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex-shrink-0">
                              Sua
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-foreground/50 uppercase">
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-foreground/50">
                              <Clock className="w-3 h-3" />
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}
                          {assigneeNames.length > 0 && (
                            <span className="text-xs text-foreground/50">
                              👤 {assigneeNames.join(', ')}
                              {task.assigneeIds.length > 2 && ` +${task.assigneeIds.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
