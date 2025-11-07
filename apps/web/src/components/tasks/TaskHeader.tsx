import React from 'react';
import type { Task } from '../../features/tasks/types';
import { Button } from '../ui/button';

type Props = {
  task: Task;
  isAssignedToMe: boolean;
  onBackClick: () => void;
};

export const TaskHeader: React.FC<Props> = ({ task, isAssignedToMe, onBackClick }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-gaming font-bold text-primary mb-2">{task.title}</h1>
        <p className="text-sm text-foreground/60">
          Criada em {new Date(task.createdAt).toLocaleString('pt-BR')}
          {task.lastAssignedByUsername || task.lastAssignedById || task.lastAssignedAt ? (
            <>
              {' '}
              •{' '}
              {isAssignedToMe ? (
                <span className="text-accent">
                  Atribuída a você por{' '}
                  {task.lastAssignedByUsername ??
                    (task.lastAssignedById ? task.lastAssignedById.slice(0, 8) : '—')}
                </span>
              ) : (
                <span>
                  Atribuída por{' '}
                  {task.lastAssignedByUsername ??
                    (task.lastAssignedById ? task.lastAssignedById.slice(0, 8) : '—')}
                </span>
              )}
              {task.lastAssignedAt
                ? ` em ${new Date(task.lastAssignedAt).toLocaleString('pt-BR')}`
                : ''}
            </>
          ) : null}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBackClick}>
          Voltar
        </Button>
      </div>
    </div>
  );
};
