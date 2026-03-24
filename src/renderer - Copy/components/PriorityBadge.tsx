import React from 'react';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showLabel?: boolean;
}

export function PriorityBadge({ priority, showLabel = false }: PriorityBadgeProps) {
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={label}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  );
}
