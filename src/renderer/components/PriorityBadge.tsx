import React from 'react';
import type { TaskPriority } from '@shared/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@shared/constants';

interface PriorityBadgeProps {
  priority: TaskPriority;
  variant?: 'dot' | 'pill' | 'button';
  size?: 'sm' | 'md';
}

const bgMap: Record<TaskPriority, string> = {
  3: 'bg-red-500/10 text-red-300',
  2: 'bg-amber-500/10 text-amber-300',
  1: 'bg-blue-500/10 text-blue-300',
  0: 'bg-zinc-500/10 text-zinc-400',
};

export function PriorityBadge({ priority, variant = 'dot', size = 'sm' }: PriorityBadgeProps) {
  if (variant === 'dot') {
    return (
      <span
        className={`inline-block rounded-full flex-shrink-0 ${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
        style={{ backgroundColor: PRIORITY_COLORS[priority] }}
        title={PRIORITY_LABELS[priority]}
      />
    );
  }

  if (variant === 'pill') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${bgMap[priority]}`}>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[priority] }}
        />
        {PRIORITY_LABELS[priority]}
      </span>
    );
  }

  // button variant — used in TaskForm priority picker
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${bgMap[priority]}`}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: PRIORITY_COLORS[priority] }}
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
