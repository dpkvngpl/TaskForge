import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Task } from '@shared/types';

interface CompletedRowProps {
  task: Task;
}

export function CompletedRow({ task }: CompletedRowProps) {
  const completionTime = task.completed_at ? format(parseISO(task.completed_at), 'h:mm a') : '';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-[8px] bg-[#1a1d27] border border-[rgba(255,255,255,0.06)] opacity-50">
      {/* Green checkmark circle */}
      <div className="w-5 h-5 rounded-full bg-[rgba(34,197,94,0.12)] flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      {/* Title (strikethrough) */}
      <span className="text-sm text-[#4b4b55] line-through flex-1">{task.title}</span>
      {/* Time */}
      <span className="text-xs text-[#4b4b55] shrink-0">{completionTime}</span>
    </div>
  );
}
