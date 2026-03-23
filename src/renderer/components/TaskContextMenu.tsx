import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS } from '@shared/constants';
import type { Task, TaskPriority, TaskStatus } from '@shared/types';
import { format } from 'date-fns';

interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
}

export function TaskContextMenu({ task, children }: TaskContextMenuProps) {
  const { updateTask, deleteTask, createTask } = useTaskStore();
  const { openTaskForm } = useViewStore();
  const categories = useSettingsStore((s) => s.settings.categories);

  const handleDuplicate = async () => {
    await createTask({
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      due_time: task.due_time,
      estimated_mins: task.estimated_mins,
      category: task.category,
      tags: [...task.tags],
      scheduled_date: task.scheduled_date,
      scheduled_slot: task.scheduled_slot,
    });
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleScheduleToday = async () => {
    await updateTask(task.id, { scheduled_date: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => openTaskForm(task.id)}>
          Edit Task
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          Duplicate Task
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Set Priority submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>Set Priority</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {([3, 2, 1, 0] as TaskPriority[]).map((p) => (
              <ContextMenuItem
                key={p}
                onClick={() => updateTask(task.id, { priority: p })}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full mr-2 inline-block"
                  style={{ backgroundColor: PRIORITY_COLORS[p] }}
                />
                {PRIORITY_LABELS[p]}
                {task.priority === p && ' ✓'}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Set Category submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>Set Category</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => updateTask(task.id, { category: null })}>
              None {!task.category && '✓'}
            </ContextMenuItem>
            {categories.map((cat) => (
              <ContextMenuItem
                key={cat}
                onClick={() => updateTask(task.id, { category: cat })}
              >
                {cat} {task.category === cat && '✓'}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Move to submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
              <ContextMenuItem
                key={s}
                onClick={() => updateTask(task.id, { status: s })}
              >
                {STATUS_LABELS[s]} {task.status === s && '✓'}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={handleScheduleToday}>
          Schedule for Today
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
