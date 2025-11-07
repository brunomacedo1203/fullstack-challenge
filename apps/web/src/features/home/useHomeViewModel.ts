import { useMemo } from 'react';
import { useAuthStore } from '../auth/store';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { listTasks } from '../tasks/tasks.api';
import { listUsers, type UserSummary } from '../users/users.api';
import { useNotificationsStore } from '../notifications/store';
import { isSameDayISO } from '../../lib/time';
import type { Task } from '../tasks/types';

export const useHomeViewModel = () => {
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
    const m = new Map<string, UserSummary>();
    for (const u of usersData ?? []) m.set(u.id, u);
    return m;
  }, [usersData]);

  const subtitle = useMemo(() => {
    const tasks = (data?.data ?? []) as Task[];
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
      return `${completedThisWeek} tarefa${
        completedThisWeek > 1 ? 's concluídas' : ' concluída'
      } esta semana 🎉`;
    }
    return 'Tudo em dia! Hora de pegar novas tarefas 💪';
  }, [data, unreadCount, user?.id]);

  const counters = useMemo(() => {
    const tasks = (data?.data ?? []) as Task[];
    const currentUserId = user?.id;

    return tasks.reduce(
      (acc, t) => {
        if (t.status === 'TODO') acc.todo += 1;
        if (t.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (t.status === 'REVIEW') acc.review += 1;
        if (t.status === 'DONE') acc.done += 1;

        if (t.assigneeIds.includes(currentUserId || '')) {
          if (t.status === 'TODO') acc.myTodo += 1;
          if (t.status === 'IN_PROGRESS') acc.myInProgress += 1;
        }

        return acc;
      },
      { todo: 0, inProgress: 0, review: 0, done: 0, myTodo: 0, myInProgress: 0 },
    );
  }, [data, user?.id]);

  const urgentTasks = useMemo(() => {
    const tasks = (data?.data ?? []) as Task[];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentUserId = user?.id;

    return tasks
      .filter((t) => {
        if (t.status === 'DONE') return false;
        const isMyTask = t.assigneeIds.includes(currentUserId || '');
        if (t.priority === 'URGENT') return true;
        if (t.priority === 'HIGH' && t.dueDate) {
          const due = new Date(t.dueDate);
          return due <= tomorrow;
        }
        if (isMyTask && t.dueDate) {
          return isSameDayISO(t.dueDate, now);
        }
        return false;
      })
      .sort((a, b) => {
        const aIsMine = a.assigneeIds.includes(currentUserId || '');
        const bIsMine = b.assigneeIds.includes(currentUserId || '');
        if (aIsMine && !bIsMine) return -1;
        if (!aIsMine && bIsMine) return 1;

        const priorityOrder: Record<Task['priority'], number> = {
          URGENT: 0,
          HIGH: 1,
          MEDIUM: 2,
          LOW: 3,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }, [data, user?.id]);

  const recentActivity = useMemo(() => {
    const tasks = (data?.data ?? []) as Task[];
    const activities: Array<{ message: string; time: string; type: string }> = [];

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

    notifications.slice(0, 2).forEach((n) => {
      activities.push({
        message: n.body || n.title || 'Notificação',
        time: n.createdAt || new Date().toISOString(),
        type: 'notification',
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [data, notifications]);

  return { user, usersById, subtitle, counters, urgentTasks, recentActivity };
};
