import React from 'react';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
};

export const TasksFilters: React.FC<Props> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-1">
        <Label>Buscar</Label>
        <Input
          placeholder="Título ou descrição..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="">Todos</option>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="REVIEW">REVIEW</option>
          <option value="DONE">DONE</option>
        </Select>
      </div>
      <div>
        <Label>Prioridade</Label>
        <Select value={priority} onChange={(e) => onPriorityChange(e.target.value)}>
          <option value="">Todas</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </Select>
      </div>
    </div>
  );
};

export default TasksFilters;
