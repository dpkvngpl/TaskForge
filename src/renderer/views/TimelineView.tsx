import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, differenceInDays, parseISO, isSameDay, isWithinInterval } from 'date-fns';
import type { Task } from '@shared/types';

type TimeRange = '1week' | '2weeks' | 'month';

export function TimelineView() {
  const tasks = useTaskStore((s) => s.tasks);
  const [range, setRange] = useState<TimeRange>('2weeks');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const totalDays = range === '1week' ? 7 : range === '2weeks' ? 14 : 30;
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(weekStart, i)), [totalDays, weekStart]);

  // Filter tasks that have due dates (exclude done/archived)
  const timelineTasks = useMemo(
    () => tasks.filter((t) => t.due_date && t.status !== 'archived').sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1)),
    [tasks]
  );

  // Count stats
  const weekCount = useMemo(() => {
    const endDate = addDays(weekStart, totalDays);
    return timelineTasks.filter((t) => {
      const d = parseISO(t.due_date!);
      return isWithinInterval(d, { start: weekStart, end: endDate });
    }).length;
  }, [timelineTasks, weekStart, totalDays]);

  const getBarProps = (task: Task) => {
    const dueDate = parseISO(task.due_date!);
    const estimatedDays = task.estimated_mins ? Math.max(1, Math.ceil(task.estimated_mins / 480)) : 1; // 8h = 1 day
    const startDay = differenceInDays(addDays(dueDate, -(estimatedDays - 1)), weekStart);
    const endDay = differenceInDays(dueDate, weekStart);

    const left = Math.max(0, startDay);
    const right = Math.min(totalDays - 1, endDay);

    if (right < 0 || left >= totalDays) return null;

    return {
      left: (left / totalDays) * 100,
      width: ((right - left + 1) / totalDays) * 100,
    };
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getBarLabel = (task: Task) => {
    const dueDate = parseISO(task.due_date!);
    if (isSameDay(dueDate, today)) return 'Today';
    const estimatedDays = task.estimated_mins ? Math.max(1, Math.ceil(task.estimated_mins / 480)) : 1;
    if (estimatedDays > 1) {
      const startDate = addDays(dueDate, -(estimatedDays - 1));
      return `${format(startDate, 'EEE')}-${format(dueDate, 'EEE')}`;
    }
    return `Due ${format(dueDate, 'EEE')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-white/5">
        <span className="text-lg font-bold"><span className="text-indigo-400">Task</span><span className="text-white">Forge</span></span>
        <div className="flex items-center gap-1 ml-auto">
          {([['1week', '1 week'], ['2weeks', '2 weeks'], ['month', 'Month']] as [TimeRange, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRange(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === val ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day columns header */}
          <div className="flex border-b border-white/5 sticky top-0 bg-[#0f0f1a] z-10">
            <div className="w-64 shrink-0 px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Tasks</div>
            <div className="flex-1 flex">
              {days.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={i} className="flex-1 text-center py-2 border-l border-white/5">
                    <div className={`text-[10px] ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                    <div className={`text-xs font-bold ${isToday ? 'text-indigo-400' : 'text-gray-300'}`}>{format(day, 'd')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task rows */}
          {timelineTasks.map((task) => {
            const barProps = getBarProps(task);
            const catShort = task.category ? task.category.slice(0, 4) : '';
            return (
              <div key={task.id} className="flex items-center border-b border-white/5 hover:bg-white/[0.02]">
                {/* Task label */}
                <div className="w-64 shrink-0 px-3 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                  <span className={`text-xs font-medium truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</span>
                  {catShort && <span className="text-[10px] text-gray-500 shrink-0">{catShort}</span>}
                </div>
                {/* Timeline bar */}
                <div className="flex-1 relative h-8">
                  {barProps && (
                    <div
                      className="absolute top-1 h-6 rounded flex items-center px-2 text-[10px] font-medium text-white truncate"
                      style={{
                        left: `${barProps.left}%`,
                        width: `${barProps.width}%`,
                        backgroundColor: PRIORITY_COLORS[task.priority],
                        minWidth: '40px',
                        opacity: task.status === 'done' ? 0.4 : 0.85,
                      }}
                    >
                      {getBarLabel(task)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
        <span>{weekCount} tasks across {range === '1week' ? '1 week' : range === '2weeks' ? '2 weeks' : '1 month'}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-500" /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-500" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500" /> Low</span>
        </div>
      </div>
    </div>
  );
}
