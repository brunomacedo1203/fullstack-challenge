import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createComment, listComments } from '../features/tasks/tasks.api';
import type { UUID } from '../features/tasks/types';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Skeleton } from './Skeleton';
import { useToast } from './ui/toast';

type Props = {
  taskId: UUID;
};

export const CommentsSection: React.FC<Props> = ({ taskId }) => {
  const [page, setPage] = useState(1);
  const size = 10;
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { show } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['comments', { taskId, page, size }],
    queryFn: () => listComments(taskId, { page, size }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: () => createComment(taskId, { content }),
    onSuccess: async () => {
      setContent('');
      show('Comentário publicado!', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['comments', { taskId }] });
      refetch();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Falha ao comentar';
      show(String(msg), { type: 'error' });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="font-gaming font-bold text-xl text-primary">Comentários</h3>

      <div className="rounded-xl border-2 border-border bg-gaming-light/50 backdrop-blur-sm p-4 space-y-3 shadow-xl">
        <Textarea
          placeholder="Escreva um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            disabled={!content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            variant="secondary"
          >
            {mutation.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border-2 border-border bg-gaming-light/30 backdrop-blur-sm divide-y divide-border shadow-xl">
        {isLoading || isFetching ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
          ))
        ) : isError ? (
          <div className="p-4 text-sm text-red-400 font-medium">Erro ao carregar comentários.</div>
        ) : !data || (data as any).data.length === 0 ? (
          <div className="p-4 text-sm text-foreground/70 text-center">Sem comentários ainda.</div>
        ) : (
          (data as any).data.map((c: any) => (
            <div key={c.id} className="p-4 hover:bg-gaming-light/30 transition-colors">
              <div className="text-xs text-foreground/60 mb-2 font-medium">
                {c.authorId ? `Autor: ${c.authorId.slice(0, 8)}` : 'Autor: —'} •{' '}
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap">{c.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/70 font-medium">
          Página {(data as any)?.page ?? page} de{' '}
          {data
            ? Math.max(1, Math.ceil(((data as any).total ?? 0) / ((data as any).size ?? 10)))
            : 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!!data && page >= Math.ceil((data as any).total / (data as any).size)}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};
