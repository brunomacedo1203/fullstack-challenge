import React from 'react';
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
import { getRelativeTime } from '../lib/time';
import { getPriorityColor, formatDueDate } from '../features/tasks/utils';
import { useHomeViewModel } from '../features/home/useHomeViewModel';

export const HomePage: React.FC = () => {
  const { user, usersById, subtitle, counters, urgentTasks, recentActivity } = useHomeViewModel();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-gaming font-bold text-primary mb-4">
          Bem-vindo(a){user ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-foreground/70 text-lg">{subtitle}</p>
      </div>

      {/* Status Cards Clicáveis */}
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
        {/* Atividade Recente */}
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

        {/*Tarefas Urgentes com Responsáveis */}
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
