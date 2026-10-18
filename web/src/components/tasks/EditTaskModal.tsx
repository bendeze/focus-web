import React from 'react';
import type { Task, Project } from '../../types';
import { TaskDetailSidebar } from './TaskDetailSidebar';

interface EditTaskModalProps {
  task: Task | null;
  projects?: Project[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onDelete?: (taskId: string) => Promise<void> | void;
  onStartFocus?: (taskId: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = (props) => {
  return <TaskDetailSidebar {...props} />;
};

export { TaskDetailSidebar };
