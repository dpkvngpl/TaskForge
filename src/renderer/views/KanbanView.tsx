import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { QuickAddBar } from '@/components/QuickAddBar';
import { FilterBar } from '@/components/FilterBar';
import { DEFAULT_KANBAN_COLUMNS } from '@shared/constants';
import type { Task, TaskStatus } from '@shared/types';

// Column icons
const colIcons: Record<string, React.ReactNode> = {
  todo: (
    <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  in_progress: (
    <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  done: (
    <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
};

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ status, label, tasks }: { status: TaskStatus; label: string; tasks: Task[] }) {
  const { openTaskForm } = useViewStore();

  return (
    <div className={`flex flex-col rounded-xl surface-elevated overflow-hidden ${status === 'done' ? 'opacity-80' : ''}`}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {colIcons[status]}
        <span className="text-[13px] font-medium text-zinc-300">{label}</span>
        <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Sortable area */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 px-1.5 pb-1.5 space-y-1.5 overflow-y-auto min-h-[100px]">
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[12px] text-zinc-700 text-center px-4">
              No tasks here — drag one in or create a new task
            </div>
          )}
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {/* Add task button (subtle) */}
      <button
        onClick={() => openTaskForm()}
        className="flex items-center gap-1.5 mx-1.5 mb-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add task
      </button>
    </div>
  );
}

export function KanbanView() {
  const { tasks, reorderTask, getTasksByStatus } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !active) return;

    const taskId = active.id as string;
    const activeData = active.data.current;
    const overData = over.data.current;

    // Determine target status
    let targetStatus: TaskStatus | undefined;
    let targetTasks: Task[];

    if (overData?.type === 'task') {
      const overTask = overData.task as Task;
      targetStatus = overTask.status;
      targetTasks = getTasksByStatus(overTask.status);
    } else {
      // Dropped on column
      return;
    }

    if (!targetStatus) return;

    // Calculate sort order
    const overIndex = targetTasks.findIndex((t) => t.id === over.id);
    let newSortOrder: number;

    if (overIndex === 0) {
      newSortOrder = targetTasks[0].sort_order - 1;
    } else if (overIndex === targetTasks.length - 1) {
      newSortOrder = targetTasks[overIndex].sort_order + 1;
    } else {
      const above = targetTasks[overIndex - 1];
      const below = targetTasks[overIndex];
      newSortOrder = (above.sort_order + below.sort_order) / 2;
    }

    reorderTask(taskId, targetStatus, newSortOrder);
  };

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done' && t.status !== 'archived').length;
  const todayTasks = tasks.filter((t) => t.status !== 'archived').length;
  const doneThisWeek = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <div className="flex-1 max-w-[400px] ml-3">
          <QuickAddBar />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          {overdue > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-medium px-1.5 py-px rounded-full -ml-4 relative -top-2">
              {overdue}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-2 border-b border-white/[0.04]">
        <FilterBar />
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-3 gap-3 p-4 overflow-hidden">
          {DEFAULT_KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.status}
              label={col.label}
              tasks={getTasksByStatus(col.status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Status bar */}
      <div className="px-5 py-2 text-[12px] text-zinc-600 border-t border-white/[0.04] flex gap-4">
        Today: <span className="text-indigo-300">{todayTasks}</span> tasks
        {overdue > 0 && (
          <> &middot; <span className="text-red-300">{overdue}</span> overdue</>
        )}
        &middot; This week: <span className="text-indigo-300">{doneThisWeek}</span> complete
      </div>

      {/* Panels */}
      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
