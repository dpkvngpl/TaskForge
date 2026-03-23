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
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { QuickAddBar } from '@/components/QuickAddBar';
import { FilterBar } from '@/components/FilterBar';
import { TaskCard } from '@/components/TaskCard';
import { TaskContextMenu } from '@/components/TaskContextMenu';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/stores/task-store';
import { DEFAULT_KANBAN_COLUMNS } from '@shared/constants';
import type { Task, TaskStatus } from '@shared/types';
import { isToday, isPast, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

function KanbanColumn({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Column header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Column body */}
      <div ref={setNodeRef} className="flex-1 min-h-0">
        <ScrollArea className="h-full px-2">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-4">
              {tasks.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No tasks here — drag one in or create a new task
                </div>
              )}
              {tasks.map((task) => (
                <TaskContextMenu key={task.id} task={task}>
                  <div>
                    <TaskCard task={task} />
                  </div>
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
      archived: [],
    };
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    // Sort each group by sort_order
    for (const key of Object.keys(grouped)) {
      grouped[key as TaskStatus].sort((a, b) => a.sort_order - b.sort_order);
    }
    return grouped;
  }, [tasks]);

  // Status bar stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    let todayCount = 0;
    let overdueCount = 0;
    let weekTotal = 0;
    let weekDone = 0;

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

  const findTaskContainer = (taskId: string): TaskStatus | null => {
    for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
      if (statusTasks.some((t) => t.id === taskId)) {
        return status as TaskStatus;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target status
    let targetStatus: TaskStatus;
    const overTask = tasks.find((t) => t.id === over.id);

    if (overTask) {
      // Dropped on another task — use that task's status
      targetStatus = overTask.status;
    } else if (['todo', 'in_progress', 'done'].includes(over.id as string)) {
      // Dropped on a column
      targetStatus = over.id as TaskStatus;
    } else {
      return;
    }

    // Calculate new sort order
    const targetTasks = tasksByStatus[targetStatus].filter((t) => t.id !== taskId);

    let newSortOrder: number;
    if (targetTasks.length === 0) {
      newSortOrder = 1;
    } else if (overTask && overTask.status === targetStatus) {
      const overIndex = targetTasks.findIndex((t) => t.id === overTask.id);
      if (overIndex === 0) {
        newSortOrder = targetTasks[0].sort_order - 1;
      } else if (overIndex === targetTasks.length - 1) {
        newSortOrder = targetTasks[targetTasks.length - 1].sort_order + 1;
      } else {
        newSortOrder = (targetTasks[overIndex - 1].sort_order + targetTasks[overIndex].sort_order) / 2;
      }
    } else {
      newSortOrder = targetTasks[targetTasks.length - 1].sort_order + 1;
    }

    reorderTask(taskId, targetStatus, newSortOrder);
  };

  return (
    <div className="flex flex-col h-full">
      <QuickAddBar />
      <FilterBar />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-0 min-h-0 divide-x divide-border">
          {DEFAULT_KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.status}
              label={col.label}
              tasks={tasksByStatus[col.status] ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t border-border text-xs text-muted-foreground flex gap-4">
        <span>Today: {stats.todayCount} tasks</span>
        {stats.overdueCount > 0 && (
          <span className="text-red-500">{stats.overdueCount} overdue</span>
        )}
        <span>Week: {stats.weekDone}/{stats.weekTotal} complete</span>
      </div>

      {/* Modals */}
      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
