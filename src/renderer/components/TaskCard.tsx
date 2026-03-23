import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DueDateChip } from './DueDateChip';
import { CategoryChip } from './CategoryChip';
import { useViewStore } from '@/stores/view-store';
import { PRIORITY_COLORS } from '@shared/constants';
import type { Task } from '@shared/types';

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, isDragOverlay = false }: TaskCardProps) {
  const { openTaskDetail, openTaskForm } = useViewStore();
  const isDone = task.status === 'done';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      openTaskForm(task.id);
    } else if (e.detail === 1) {
      openTaskDetail(task.id);
    }
  };

  const borderColor = PRIORITY_COLORS[task.priority];

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        borderLeftWidth: '3px',
        borderLeftColor: borderColor,
      }}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={handleClick}
      className={`group relative px-3 py-2.5 rounded-lg bg-[#1e1e35] border border-white/5 cursor-grab active:cursor-grabbing
        hover:bg-[#252545] hover:border-white/10 transition-all
        ${isDone ? 'opacity-50' : ''}
        ${isDragging ? 'shadow-xl shadow-black/30' : ''}`}
    >
      {/* Title */}
      <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-gray-500' : 'text-gray-100'}`}>
        {task.title}
      </p>

      {/* Meta row: due date + category + tags */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
        <CategoryChip category={task.category} />
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}
