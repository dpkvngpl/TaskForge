import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PRIORITY_COLORS } from '@shared/constants';
import type { Task } from '@shared/types';

interface WeekTaskBlockProps {
  task: Task;
  onClick: () => void;
}

const priorityBgMap: Record<number, string> = {
  3: 'rgba(239,68,68,0.08)',
  2: 'rgba(245,158,11,0.08)',
  1: 'rgba(59,130,246,0.08)',
  0: 'rgba(55,65,81,0.15)',
};

export function WeekTaskBlock({ task, onClick }: WeekTaskBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        ...style,
        borderLeftWidth: '3px',
        borderLeftColor: PRIORITY_COLORS[task.priority],
        backgroundColor: priorityBgMap[task.priority],
        opacity: isDragging ? 0.5 : 1,
      }}
      className="px-1.5 py-1 rounded cursor-grab active:cursor-grabbing transition-opacity"
    >
      <p className="text-[11px] font-medium text-[#e2e2e6] truncate leading-tight">{task.title}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {task.estimated_mins && (
          <span className="text-[10px] text-[#a5a5af]">
            ~{task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}
          </span>
        )}
        {task.category && (
          <span className="text-[10px] text-[#a5a5af]">
            {task.estimated_mins ? '· ' : ''}{task.category}
          </span>
        )}
      </div>
    </div>
  );
}
