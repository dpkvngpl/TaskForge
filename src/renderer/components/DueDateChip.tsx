import React from 'react';
import { differenceInDays, isToday, isTomorrow, isPast, parseISO, format } from 'date-fns';

interface DueDateChipProps {
  dueDate: string | null;
  dueTime?: string | null;
  showIcon?: boolean;
}

export function DueDateChip({ dueDate, dueTime, showIcon = false }: DueDateChipProps) {
  if (!dueDate) return null;

  const date = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = differenceInDays(date, today);
  const overdue = isPast(date) && !isToday(date);

  let label: string;
  let colorClass: string;

  if (overdue) {
    const daysOverdue = Math.abs(diff);
    label = daysOverdue === 1 ? 'Overdue 1d' : `Overdue ${daysOverdue}d`;
    colorClass = 'bg-red-500/10 text-red-300';
  } else if (isToday(date)) {
    label = dueTime ? `Today ${dueTime}` : 'Due today';
    colorClass = 'bg-amber-500/10 text-amber-300';
  } else if (isTomorrow(date)) {
    label = 'Tomorrow';
    colorClass = 'bg-amber-500/10 text-amber-200';
  } else if (diff <= 7) {
    label = `Due ${format(date, 'EEE')}`;
    colorClass = 'bg-zinc-500/10 text-zinc-400';
  } else {
    label = format(date, 'MMM d');
    colorClass = 'bg-zinc-500/10 text-zinc-400';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${colorClass}`}>
      {showIcon && (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )}
      {label}
    </span>
  );
}
