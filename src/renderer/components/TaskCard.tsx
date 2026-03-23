import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge } from './PriorityBadge';
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
        opacity: isDragging ? 0.4 : 1,
      };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click → edit
      openTaskForm(task.id);
    } else if (e.detail === 1) {
      // Single click → detail panel
      openTaskDetail(task.id);
    }
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={handleClick}
      className={`group relative px-3 py-2 rounded-md bg-card border border-border cursor-grab active:cursor-grabbing
        hover:bg-accent/30 hover:shadow-sm transition-all
        ${isDone ? 'opacity-60' : ''}
        ${isDragging ? 'shadow-lg' : ''}`}
      style={{
        ...style,
        borderLeftWidth: '3px',
        borderLeftColor: PRIORITY_COLORS[task.priority],
      }}
    >
      {/* First line: priority dot + title */}
      <div className="flex items-center gap-2 min-w-0">
        <PriorityBadge priority={task.priority} />
        <span className={`text-sm truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </span>
        {task.source_connector && task.source_connector !== 'manual' && (
          <span className="text-xs text-muted-foreground shrink-0" title={`Source: ${task.source_connector}`}>
            &#x1f517;
          </span>
        )}
      </div>

      {/* Second line: due date + category + tags */}
      <div className="flex items-center gap-2 mt-1 min-w-0">
        <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
        <CategoryChip category={task.category} />
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] px-1 py-0 rounded bg-muted text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
