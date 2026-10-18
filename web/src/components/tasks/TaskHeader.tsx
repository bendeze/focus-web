import React from 'react';
import { Plus, ListTodo } from 'lucide-react';

interface TaskHeaderProps {
  totalCount: number;
  isCreating: boolean;
  onToggleCreate: () => void;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  totalCount,
  isCreating,
  onToggleCreate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 select-none">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
          <ListTodo className="w-3.5 h-3.5" />
          <span className="tracking-wide uppercase text-[10px]">
            Workspace Backlog
          </span>
          <span className="opacity-40">·</span>
          <span className="tracking-wide uppercase text-[10px]">
            {totalCount} {totalCount === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white dark:text-white light:text-black">
          Tasks & Sprints
        </h1>
      </div>

      <button
        onClick={onToggleCreate}
        className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 bg-white dark:bg-white text-black light:bg-black light:text-white hover:opacity-90 active:scale-[0.85] transition-all shadow-sm cursor-pointer self-start sm:self-auto"
      >
        <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${isCreating ? 'rotate-45' : ''}`} />
        <span>{isCreating ? 'Close Form' : 'New Task'}</span>
      </button>
    </div>
  );
};
