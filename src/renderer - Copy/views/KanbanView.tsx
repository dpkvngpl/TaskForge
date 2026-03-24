import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from '@/components/TaskCard';
import { TaskContextMenu } from '@/components/TaskContextMenu';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_KANBAN_COLUMNS } from '@shared/constants';
import type { Task, TaskStatus } from '@shared/types';
import { isToday, isPast, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

// Column status icons — use inline styles to guarantee sizing
const columnIcons: Record<string, React.ReactNode> = {
  todo: <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #6b7280', display: 'inline-block', flexShrink: 0 }} />,
  in_progress: (
    <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  done: (
    <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="9 12 11.5 14.5 16 9.5" />
    </svg>
  ),
};

function KanbanColumn({ status, label, tasks }: { status: TaskStatus; label: string; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 py-2.5 flex items-center gap-2">
        {columnIcons[status]}
        <h3 className="text-sm font-semibold text-gray-200">{label}</h3>
        <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5 ml-1">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-0">
        <ScrollArea className="h-full px-2">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-4">
              {tasks.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-600">No tasks here — drag one in or create a new task</div>
              )}
              {tasks.map((task) => (
                <TaskContextMenu key={task.id} task={task}>
                  <div><TaskCard task={task} /></div>
                </TaskContextMenu>
              ))}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
}

export function KanbanView() {
  const { tasks, reorderTask } = useTaskStore();
  const { openTaskForm } = useViewStore();
  const categories = useSettingsStore((s) => s.settings.categories);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [quickAdd, setQuickAdd] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const createTask = useTaskStore((s) => s.createTask);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Listen for quick-add
  React.useEffect(() => {
    const handler = () => {
      const input = document.getElementById('kanban-quick-add') as HTMLInputElement;
      input?.focus();
    };
    window.addEventListener('taskforge:quick-add', handler);
    return () => window.removeEventListener('taskforge:quick-add', handler);
  }, []);

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (!categoryFilter) return tasks;
    return tasks.filter((t) => t.category === categoryFilter);
  }, [tasks, categoryFilter]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [], archived: [] };
    for (const task of filteredTasks) {
      if (grouped[task.status]) grouped[task.status].push(task);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key as TaskStatus].sort((a, b) => a.sort_order - b.sort_order);
    }
    return grouped;
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    let todayCount = 0, overdueCount = 0, weekTotal = 0, weekDone = 0;
    for (const task of tasks) {
      if (task.due_date) {
        const d = parseISO(task.due_date);
        if (isToday(d)) todayCount++;
        if (isPast(d) && !isToday(d) && task.status !== 'done') overdueCount++;
        if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
          weekTotal++;
          if (task.status === 'done') weekDone++;
        }
      }
    }
    return { todayCount, overdueCount, weekTotal, weekDone };
  }, [tasks]);

  // Unique categories from tasks
  const activeCategories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats);
  }, [tasks]);

  const handleQuickAdd = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickAdd.trim()) {
      await createTask({ title: quickAdd.trim(), status: 'todo', priority: 2 });
      setQuickAdd('');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let targetStatus: TaskStatus;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) targetStatus = overTask.status;
    else if (['todo', 'in_progress', 'done'].includes(over.id as string)) targetStatus = over.id as TaskStatus;
    else return;

    const targetTasks = tasksByStatus[targetStatus].filter((t) => t.id !== taskId);
    let newSortOrder: number;
    if (targetTasks.length === 0) newSortOrder = 1;
    else if (overTask && overTask.status === targetStatus) {
      const idx = targetTasks.findIndex((t) => t.id === overTask.id);
      if (idx === 0) newSortOrder = targetTasks[0].sort_order - 1;
      else if (idx === targetTasks.length - 1) newSortOrder = targetTasks[targetTasks.length - 1].sort_order + 1;
      else newSortOrder = (targetTasks[idx - 1].sort_order + targetTasks[idx].sort_order) / 2;
    } else newSortOrder = targetTasks[targetTasks.length - 1].sort_order + 1;

    reorderTask(taskId, targetStatus, newSortOrder);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-white/5">
        <span className="text-lg font-bold"><span className="text-indigo-400">Task</span><span className="text-white">Forge</span></span>
        <div className="flex-1 max-w-lg">
          <input
            id="kanban-quick-add"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={handleQuickAdd}
            placeholder="Add a task... (Ctrl+N)"
            className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button>
          <button onClick={() => openTaskForm()} className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !categoryFilter ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 border border-white/10 hover:bg-white/5'
          }`}
        >All tasks</button>
        {activeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 border border-white/10 hover:bg-white/5'
            }`}
          >{cat}</button>
        ))}
        <span className="ml-auto text-xs text-gray-500">{filteredTasks.length} tasks</span>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-0 min-h-0 divide-x divide-white/5">
          {DEFAULT_KANBAN_COLUMNS.map((col) => (
            <KanbanColumn key={col.id} status={col.status} label={col.label} tasks={tasksByStatus[col.status] ?? []} />
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} isDragOverlay />}</DragOverlay>
      </DndContext>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-500 flex gap-3">
        <span>Today: <span className="text-gray-300 font-medium">{stats.todayCount}</span> tasks</span>
        {stats.overdueCount > 0 && <span className="text-red-400">{stats.overdueCount} overdue</span>}
        <span>This week: <span className="text-green-400 font-medium">{stats.weekDone}</span>/{stats.weekTotal} complete</span>
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
