export function getPriorityColor(priority: string): string {
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
}

export function formatDueDate(dueDate?: string | null): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Atrasada';
  if (diffDays === 0) return 'Vence hoje';
  if (diffDays === 1) return 'Vence amanhã';
  return `${diffDays} dias`;
}
