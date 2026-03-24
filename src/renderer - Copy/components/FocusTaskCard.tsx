import React from 'react';
import { DueDateChip } from './DueDateChip';
import { CategoryChip } from './CategoryChip';
import { PRIORITY_COLORS } from '@shared/constants';
import type { Task } from '@shared/types';

interface FocusTaskCardProps {
  task: Task;
  onComplete: () => void;
  onStart: () => void;
  onClick: () => void;
}

export function FocusTaskCard({ task, onComplete, onStart, onClick }: FocusTaskCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-[8px] bg-[#1a1d27] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] cursor-pointer transition-colors"
    >
      {/* Priority circle checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
        style={{ borderColor: PRIORITY_COLORS[task.priority] }}
        title="Mark as done"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#e2e2e6]">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-[#a5a5af] mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
          <CategoryChip category={task.category} />
          {task.estimated_mins && (
            <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}
            </span>
          )}
        </div>
      </div>

      {/* Start now button */}
      <button
        onClick={(e) => { e.stopPropagation(); onStart(); }}
        className="px-4 py-2 rounded-[6px] border border-[rgba(255,255,255,0.06)] text-sm font-medium text-[#e2e2e6] hover:bg-[rgba(255,255,255,0.06)] transition-colors shrink-0"
      >
        Start now
      </button>
    </div>
  );
}
