import React from 'react';
import { formatDistanceToNow, parseISO, isToday, isPast, isTomorrow, differenceInDays } from 'date-fns';

interface DueDateChipProps {
  dueDate: string | null;
  dueTime?: string | null;
  compact?: boolean;
}

export function DueDateChip({ dueDate, dueTime, compact = false }: DueDateChipProps) {
  if (!dueDate) return null;

  const date = parseISO(dueDate);
  const overdue = isPast(date) && !isToday(date);
  const today = isToday(date);
  const tomorrow = isTomorrow(date);

  let label: string;
  if (overdue) {
    const days = Math.abs(differenceInDays(new Date(), date));
    label = `Overdue ${days}d`;
  } else if (today) {
    label = 'Due today';
  } else if (tomorrow) {
    label = 'Due tomorrow';
  } else {
    const days = differenceInDays(date, new Date());
    if (days <= 7) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      label = `Due ${dayNames[date.getDay()]}`;
    } else {
      label = `Due next week`;
    }
  }

  if (dueTime && !compact) {
    label += ` at ${dueTime}`;
  }

  const colorClasses = overdue
    ? 'bg-red-500/15 text-red-400 border-red-500/20'
    : today
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : 'bg-white/5 text-gray-400 border-white/5';

  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorClasses}`}>
      {label}
    </span>
  );
}
