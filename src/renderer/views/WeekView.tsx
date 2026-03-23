import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@shared/types';

const SLOTS = ['morning', 'afternoon', 'evening'] as const;
const SLOT_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export function WeekView() {
  const { tasks, updateTask } = useTaskStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

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

  const unscheduled = useMemo(
    () => tasks.filter((t) => (!t.scheduled_date || !t.scheduled_slot) && t.status !== 'done' && t.status !== 'archived'),
    [tasks]
  );

  const scheduledCount = useMemo(() => tasks.filter((t) => t.scheduled_date && t.scheduled_slot && t.status !== 'done').length, [tasks]);
  const totalActive = useMemo(() => tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').length, [tasks]);

  const weekLabel = `${format(days[0], 'd')} - ${format(days[6], 'd MMM yyyy')}`;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Click a cell to schedule the selected task there
  const handleCellClick = async (day: Date, slot: string) => {
    if (!selectedTaskId) return;
    await updateTask(selectedTaskId, {
      scheduled_date: format(day, 'yyyy-MM-dd'),
      scheduled_slot: slot,
    });
    setSelectedTaskId(null);
  };

  // Click a scheduled task to unschedule it
  const handleUnschedule = async (taskId: string) => {
    await updateTask(taskId, {
      scheduled_date: null,
      scheduled_slot: null,
    });
  };

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
        <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-white/10 hover:bg-white/5">Today</button>
      </div>

      {selectedTaskId && (
        <div className="px-4 py-2 bg-indigo-600/10 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
          <span>Click a time slot to schedule the selected task</span>
          <button onClick={() => setSelectedTaskId(null)} className="ml-auto text-indigo-400 hover:text-white">Cancel</button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
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
                      <td
                        key={di}
                        className={`p-1.5 border-l border-white/5 align-top min-h-[80px] h-24 ${
                          selectedTaskId ? 'cursor-pointer hover:bg-indigo-600/10' : ''
                        }`}
                        onClick={() => handleCellClick(day, slot)}
                      >
                        <div className="space-y-1">
                          {cellTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-1.5 rounded-md text-[11px] leading-tight cursor-pointer hover:opacity-80"
                              style={{
                                borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                                backgroundColor: `${PRIORITY_COLORS[task.priority]}10`,
                              }}
                              onClick={(e) => { e.stopPropagation(); handleUnschedule(task.id); }}
                              title="Click to unschedule"
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
                onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedTaskId === task.id
                    ? 'bg-indigo-600/20 border-indigo-500/30'
                    : 'bg-[#1e1e35] border-white/5 hover:border-white/10'
                }`}
                style={{ borderLeftWidth: '3px', borderLeftColor: PRIORITY_COLORS[task.priority] }}
              >
                <p className="text-xs font-medium text-gray-200">{task.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {task.due_date ? `Due ${format(parseISO(task.due_date), 'EEE')}` : 'No due date'}
                </p>
              </div>
            ))}
            {unscheduled.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-4">All tasks scheduled!</p>
            )}
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
