import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@shared/types';

const SLOTS = ['morning', 'afternoon', 'evening'] as const;
const SLOT_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export function WeekView() {
  const tasks = useTaskStore((s) => s.tasks);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Group tasks by day + slot
  const scheduledTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.scheduled_date && task.scheduled_slot && task.status !== 'done') {
        const key = `${task.scheduled_date}:${task.scheduled_slot}`;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [tasks]);

  // Unscheduled tasks (no scheduled_date or no scheduled_slot, not done)
  const unscheduled = useMemo(
    () => tasks.filter((t) => (!t.scheduled_date || !t.scheduled_slot) && t.status !== 'done' && t.status !== 'archived'),
    [tasks]
  );

  // Count scheduled
  const scheduledCount = useMemo(() => tasks.filter((t) => t.scheduled_date && t.scheduled_slot && t.status !== 'done').length, [tasks]);
  const totalActive = useMemo(() => tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').length, [tasks]);

  const weekLabel = `${format(days[0], 'd')} - ${format(days[6], 'd MMM yyyy')}`;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-white/5">
        <span className="text-lg font-bold"><span className="text-indigo-400">Task</span><span className="text-white">Forge</span></span>
        <div className="flex items-center gap-2 mx-auto">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span className="text-sm font-semibold text-gray-200 min-w-[180px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-white/10 hover:bg-white/5">
          Today
        </button>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            {/* Day headers */}
            <thead>
              <tr>
                <th className="w-20 p-2 text-xs text-gray-500 font-normal text-left" />
                {days.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <th key={i} className="p-2 text-center border-l border-white/5">
                      <div className={`text-xs font-normal ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>{dayNames[i]}</div>
                      <div className={`text-lg font-bold ${isToday ? 'text-indigo-400' : 'text-gray-200'}`}>{format(day, 'd')}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-t border-white/5">
                  <td className="p-2 text-xs text-gray-500 align-top font-normal">{SLOT_LABELS[slot]}</td>
                  {days.map((day, di) => {
                    const key = `${format(day, 'yyyy-MM-dd')}:${slot}`;
                    const cellTasks = scheduledTasks[key] ?? [];
                    return (
                      <td key={di} className="p-1.5 border-l border-white/5 align-top min-h-[80px] h-24">
                        <div className="space-y-1">
                          {cellTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-1.5 rounded-md text-[11px] leading-tight"
                              style={{
                                borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                                backgroundColor: `${PRIORITY_COLORS[task.priority]}10`,
                              }}
                            >
                              <p className="font-medium text-gray-200 truncate">{task.title}</p>
                              <div className="text-gray-500 mt-0.5 flex gap-1">
                                {task.estimated_mins && <span>~{task.estimated_mins >= 60 ? `${Math.floor(task.estimated_mins / 60)}h` : `${task.estimated_mins}m`}</span>}
                                {task.category && <span>· {task.category}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Unscheduled sidebar */}
        <div className="w-56 border-l border-white/5 flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/5">
            <span className="text-sm font-semibold text-gray-200">Unscheduled</span>
            <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5">{unscheduled.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {unscheduled.map((task) => (
              <div
                key={task.id}
                className="p-2 rounded-lg bg-[#1e1e35] border border-white/5"
                style={{ borderLeftWidth: '3px', borderLeftColor: PRIORITY_COLORS[task.priority] }}
              >
                <p className="text-xs font-medium text-gray-200">{task.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {task.due_date ? `Due ${format(parseISO(task.due_date), 'EEE')}` : 'No due date'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3 text-xs text-gray-500">
        <span>Week progress: <span className="text-indigo-400 font-medium">{scheduledCount}</span>/{totalActive} scheduled</span>
        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden ml-1">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalActive ? (scheduledCount / totalActive) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  );
}
