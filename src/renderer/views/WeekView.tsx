import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { WeekTaskBlock } from '@/components/WeekTaskBlock';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { PRIORITY_COLORS } from '@shared/constants';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@shared/types';

const SLOTS = ['morning', 'afternoon', 'evening'] as const;
const SLOT_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Droppable cell for each day+slot
function SlotCell({ dayStr, slot, children }: { dayStr: string; slot: string; children: React.ReactNode }) {
  const droppableId = `${dayStr}-${slot}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <td
      ref={setNodeRef}
      className={`p-1 border-l border-[rgba(255,255,255,0.06)] align-top h-24 min-w-[100px] transition-colors ${
        isOver ? 'bg-[rgba(99,102,241,0.08)]' : ''
      }`}
    >
      <div className="space-y-1">{children}</div>
    </td>
  );
}

// Draggable unscheduled card
function UnscheduledCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        ...style,
        borderLeftWidth: '3px',
        borderLeftColor: PRIORITY_COLORS[task.priority],
        opacity: isDragging ? 0.4 : 1,
      }}
      className="p-2 rounded-lg bg-[#1a1d27] border border-[rgba(255,255,255,0.06)] cursor-grab active:cursor-grabbing hover:border-[rgba(255,255,255,0.12)] transition-all"
    >
      <p className="text-xs font-medium text-[#e2e2e6]">{task.title}</p>
      <p className="text-[10px] text-[#6b7280] mt-0.5">
        {task.due_date ? `Due ${format(parseISO(task.due_date), 'EEE')}` : 'No due date'}
      </p>
    </div>
  );
}

export function WeekView() {
  const { tasks, updateTask } = useTaskStore();
  const { openTaskDetail } = useViewStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const weekStart = useMemo(() => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7), [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Group scheduled tasks by "YYYY-MM-DD-slot"
  const scheduledMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.scheduled_date && task.scheduled_slot && task.status !== 'done' && task.status !== 'archived') {
        const key = `${task.scheduled_date}-${task.scheduled_slot}`;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [tasks]);

  // Unscheduled: has due_date but no scheduled_date, or no scheduled_slot
  const unscheduled = useMemo(
    () => tasks.filter((t) =>
      t.status !== 'done' && t.status !== 'archived' &&
      (!t.scheduled_date || !t.scheduled_slot)
    ).sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.priority - a.priority;
    }),
    [tasks]
  );

  const scheduledCount = useMemo(() =>
    tasks.filter((t) => t.scheduled_date && t.scheduled_slot && t.status !== 'done' && t.status !== 'archived').length,
    [tasks]
  );
  const totalActive = useMemo(() =>
    tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').length,
    [tasks]
  );

  const weekLabel = `${format(days[0], 'd')} - ${format(days[6], 'd MMM yyyy')}`;

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const droppableId = over.id as string;

    // Parse droppable id: "YYYY-MM-DD-slot"
    const match = droppableId.match(/^(\d{4}-\d{2}-\d{2})-(\w+)$/);
    if (!match) return;

    const [, date, slot] = match;
    updateTask(taskId, {
      scheduled_date: date,
      scheduled_slot: slot,
    });
  };

  const progressPct = totalActive > 0 ? Math.round((scheduledCount / totalActive) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-lg font-bold"><span className="text-[#6366f1]">Task</span><span className="text-[#e2e2e6]">Forge</span></span>
        <div className="flex items-center gap-2 mx-auto">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e2e6] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span className="text-sm font-semibold text-[#e2e2e6] min-w-[180px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e2e6] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#e2e2e6] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] transition-colors">
          Today
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main grid */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[72px] p-2 text-xs text-[#6b7280] font-normal text-left" />
                  {days.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    const isWeekend = i >= 5;
                    return (
                      <th key={i} className={`p-2 text-center border-l border-[rgba(255,255,255,0.06)] ${isToday ? 'bg-[rgba(99,102,241,0.03)]' : ''}`}>
                        <div className={`text-[11px] font-normal ${isToday ? 'text-[#6366f1]' : isWeekend ? 'text-[#4b4b55]' : 'text-[#6b7280]'}`}>{DAY_NAMES[i]}</div>
                        <div className={`text-lg font-bold ${isToday ? 'text-[#6366f1]' : isWeekend ? 'text-[#4b4b55]' : 'text-[#e2e2e6]'}`}>{format(day, 'd')}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot} className="border-t border-[rgba(255,255,255,0.06)]">
                    <td className="p-2 text-xs text-[#6b7280] align-top font-normal">{SLOT_LABELS[slot]}</td>
                    {days.map((day, di) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const key = `${dayStr}-${slot}`;
                      const cellTasks = scheduledMap[key] ?? [];
                      const isToday = isSameDay(day, new Date());
                      return (
                        <SlotCell key={di} dayStr={dayStr} slot={slot}>
                          {cellTasks.map((task) => (
                            <WeekTaskBlock key={task.id} task={task} onClick={() => openTaskDetail(task.id)} />
                          ))}
                        </SlotCell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unscheduled sidebar */}
          <div className="w-[200px] border-l border-[rgba(255,255,255,0.06)] flex flex-col overflow-hidden shrink-0">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-sm font-semibold text-[#e2e2e6]">Unscheduled</span>
              <span className="text-xs text-[#6b7280] bg-[rgba(255,255,255,0.06)] rounded-full px-2 py-0.5">{unscheduled.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {unscheduled.map((task) => (
                <UnscheduledCard key={task.id} task={task} onClick={() => openTaskDetail(task.id)} />
              ))}
              {unscheduled.length === 0 && (
                <p className="text-xs text-[#4b4b55] text-center py-4">All tasks scheduled!</p>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div
              className="px-2 py-1.5 rounded bg-[#1a1d27] border border-[rgba(255,255,255,0.12)] shadow-xl"
              style={{ borderLeftWidth: '3px', borderLeftColor: PRIORITY_COLORS[activeTask.priority] }}
            >
              <p className="text-[11px] font-medium text-[#e2e2e6]">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-3 text-xs text-[#6b7280]">
        <span>Week progress: <span className="text-[#6366f1] font-medium">{scheduledCount}</span>/{totalActive} scheduled</span>
        <div className="w-24 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden ml-1">
          <div className="h-full bg-[#6366f1] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-[#a5a5af]">{progressPct}%</span>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
