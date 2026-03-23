import React from 'react';
import { formatDistanceToNow, parseISO, isToday, isPast, isTomorrow } from 'date-fns';

interface DueDateChipProps {
  dueDate: string | null;
  dueTime?: string | null;
}

export function DueDateChip({ dueDate, dueTime }: DueDateChipProps) {
  if (!dueDate) return null;

  const date = parseISO(dueDate);
  const overdue = isPast(date) && !isToday(date);
  const today = isToday(date);
  const tomorrow = isTomorrow(date);

  let label: string;
  if (today) {
    label = 'Today';
  } else if (tomorrow) {
    label = 'Tomorrow';
  } else if (overdue) {
    label = `Overdue by ${formatDistanceToNow(date)}`;
  } else {
    label = `In ${formatDistanceToNow(date)}`;
  }

  if (dueTime) {
    label += ` at ${dueTime}`;
  }

  const colorClass = overdue
    ? 'text-red-500'
    : today
      ? 'text-amber-500'
      : 'text-muted-foreground';

  return (
    <span className={`text-xs ${colorClass}`}>
      {label}
    </span>
  );
}
