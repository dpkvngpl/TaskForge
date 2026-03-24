import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, differenceInDays, parseISO, isSameDay, isWeekend } from 'date-fns';
import type { Task } from '@shared/types';

type TimeRange = '1week' | '2weeks' | 'month';

const COL_WIDTH: Record<TimeRange, number> = { '1week': 48, '2weeks': 48, 'month': 24 };
const DAY_COUNT: Record<TimeRange, number> = { '1week': 7, '2weeks': 14, 'month': 30 };
const ROW_HEIGHT = 38;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimelineView() {
  const tasks = useTaskStore((s) => s.tasks);
  const { openTaskDetail } = useViewStore();
  const [range, setRange] = useState<TimeRange>('2weeks');

  const taskListRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const totalDays = DAY_COUNT[range];
  const colWidth = COL_WIDTH[range];
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(weekStart, i)), [totalDays, weekStart]);

  // Sync scroll between task list and gantt
  const handleGanttScroll = useCallback(() => {
    if (ganttRef.current && taskListRef.current) {
      taskListRef.current.scrollTop = ganttRef.current.scrollTop;
    }
  }, []);
  const handleListScroll = useCallback(() => {
    if (taskListRef.current && ganttRef.current) {
      ganttRef.current.scrollTop = taskListRef.current.scrollTop;
    }
  }, []);

  // Filter tasks with due dates
  const timelineTasks = useMemo(
    () => tasks
      .filter((t) => t.due_date && t.status !== 'archived')
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1)),
    [tasks]
  );

  // Today line position
  const todayOffset = differenceInDays(today, weekStart);
  const todayX = todayOffset >= 0 && todayOffset < totalDays ? todayOffset * colWidth + colWidth / 2 : -1;

  const getBarProps = (task: Task) => {
    const dueDate = parseISO(task.due_date!);
    const estimatedDays = task.estimated_mins ? Math.max(1, Math.ceil(task.estimated_mins / 480)) : 1;
    const barEnd = differenceInDays(dueDate, weekStart);
    const barStart = barEnd - estimatedDays + 1;
    const clampedStart = Math.max(0, barStart);
    const clampedEnd = Math.min(totalDays - 1, barEnd);
    if (clampedEnd < 0 || clampedStart >= totalDays) return null;
    return {
      left: clampedStart * colWidth,
      width: (clampedEnd - clampedStart + 1) * colWidth,
    };
  };

  const getBarLabel = (task: Task) => {
    const dueDate = parseISO(task.due_date!);
    if (isSameDay(dueDate, today)) return 'Today';
    const estimatedDays = task.estimated_mins ? Math.max(1, Math.ceil(task.estimated_mins / 480)) : 1;
    if (estimatedDays > 1) {
      const startDate = addDays(dueDate, -(estimatedDays - 1));
      if (estimatedDays <= 3) return `${format(startDate, 'EEE')}-${format(dueDate, 'EEE')}`;
      return `Ongoing — due ${format(dueDate, 'EEE')}`;
    }
    return `Due ${format(dueDate, 'EEE')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-lg font-bold"><span className="text-[#6366f1]">Task</span><span className="text-[#e2e2e6]">Forge</span></span>
        <div className="flex items-center gap-1 ml-auto">
          {([['1week', '1 week'], ['2weeks', '2 weeks'], ['month', 'Month']] as [TimeRange, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRange(val)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                range === val ? 'bg-[#6366f1] text-white' : 'text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Task list panel (220px) */}
        <div className="w-[220px] shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.06)]">
          {/* Header row */}
          <div className="h-[52px] px-3 flex items-end pb-2 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-xs text-[#6b7280] font-semibold uppercase tracking-wider">Tasks</span>
          </div>
          {/* Scrollable task rows */}
          <div ref={taskListRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto overflow-x-hidden">
            {timelineTasks.map((task) => {
              const catShort = task.category ? task.category.slice(0, 4) : '';
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskDetail(task.id)}
                  className="flex items-center gap-2 px-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                  <span className={`text-xs font-medium truncate flex-1 ${task.status === 'done' ? 'line-through text-[#4b4b55]' : 'text-[#e2e2e6]'}`}>
                    {task.title}
                  </span>
                  {catShort && <span className="text-[10px] text-[#6b7280] shrink-0">{catShort}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gantt grid (scrollable) */}
        <div ref={ganttRef} onScroll={handleGanttScroll} className="flex-1 overflow-auto">
          <div style={{ width: totalDays * colWidth, minHeight: '100%' }} className="relative">
            {/* Day headers */}
            <div className="flex sticky top-0 z-10 bg-[#0f1117] border-b border-[rgba(255,255,255,0.06)]" style={{ height: 52 }}>
              {days.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                const isWkend = isWeekend(day);
                const dayIdx = day.getDay() === 0 ? 6 : day.getDay() - 1;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-end pb-2 border-l border-[rgba(255,255,255,0.06)] ${isWkend ? 'bg-[rgba(255,255,255,0.01)]' : ''}`}
                    style={{ width: colWidth }}
                  >
                    <span className={`text-[10px] ${isToday ? 'text-[#6366f1]' : isWkend ? 'text-[#4b4b55]' : 'text-[#6b7280]'}`}>{DAY_NAMES[dayIdx]}</span>
                    <span className={`text-xs font-bold ${isToday ? 'text-[#6366f1]' : isWkend ? 'text-[#4b4b55]' : 'text-[#e2e2e6]'}`}>{format(day, 'd')}</span>
                  </div>
                );
              })}
            </div>

            {/* Task rows with bars */}
            {timelineTasks.map((task) => {
              const barProps = getBarProps(task);
              return (
                <div key={task.id} className="relative border-b border-[rgba(255,255,255,0.06)]" style={{ height: ROW_HEIGHT }}>
                  {barProps && (
                    <div
                      onClick={() => openTaskDetail(task.id)}
                      className="absolute top-2 rounded cursor-pointer flex items-center px-2 text-[10px] font-medium text-white truncate hover:brightness-110 transition-all"
                      style={{
                        left: barProps.left,
                        width: barProps.width,
                        height: 22,
                        backgroundColor: PRIORITY_COLORS[task.priority],
                        minWidth: 40,
                        opacity: task.status === 'done' ? 0.4 : 0.85,
                        borderRadius: 4,
                      }}
                    >
                      {barProps.width > 80 ? getBarLabel(task) : ''}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Today line */}
            {todayX >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#6366f1] opacity-50 z-5 pointer-events-none"
                style={{ left: todayX }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[#6b7280]">
        <span>{timelineTasks.length} tasks across {range === '1week' ? '1 week' : range === '2weeks' ? '2 weeks' : '1 month'}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#ef4444' }} /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#f59e0b' }} /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#3b82f6' }} /> Low</span>
        </div>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
