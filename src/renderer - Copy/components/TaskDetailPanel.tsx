import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriorityBadge } from './PriorityBadge';
import { DueDateChip } from './DueDateChip';
import { CategoryChip } from './CategoryChip';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { STATUS_LABELS, PRIORITY_LABELS } from '@shared/constants';
import { format, parseISO } from 'date-fns';

export function TaskDetailPanel() {
  const { isTaskDetailOpen, selectedTaskId, closeTaskDetail, openTaskForm } = useViewStore();
  const { tasks, updateTask, deleteTask } = useTaskStore();

  const task = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  const handleDelete = async () => {
    if (task && confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
      closeTaskDetail();
    }
  };

  const handleStatusChange = async (status: 'in_progress' | 'done') => {
    if (task) {
      await updateTask(task.id, { status });
    }
  };

  return (
    <Sheet open={isTaskDetailOpen} onOpenChange={(open) => !open && closeTaskDetail()}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto">
        {task ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg pr-8">{task.title}</SheetTitle>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openTaskForm(task.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* Status + Priority */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{STATUS_LABELS[task.status]}</Badge>
                <PriorityBadge priority={task.priority} showLabel />
              </div>

              <Separator />

              {/* Due date */}
              {task.due_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{format(parseISO(task.due_date), 'PPP')}</span>
                    {task.due_time && <span className="text-sm text-muted-foreground">at {task.due_time}</span>}
                    <DueDateChip dueDate={task.due_date} dueTime={task.due_time} />
                  </div>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Category + Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={task.category} />
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>

              {/* Estimated time */}
              {task.estimated_mins && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                  <p className="text-sm">
                    {task.estimated_mins >= 60
                      ? `${Math.floor(task.estimated_mins / 60)}h ${task.estimated_mins % 60}m`
                      : `${task.estimated_mins}m`}
                  </p>
                </div>
              )}

              {/* Schedule */}
              {(task.scheduled_date || task.scheduled_slot) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                  <p className="text-sm">
                    {task.scheduled_date && format(parseISO(task.scheduled_date), 'PPP')}
                    {task.scheduled_slot && ` — ${task.scheduled_slot}`}
                  </p>
                </div>
              )}

              {/* Source */}
              {task.source_connector && task.source_connector !== 'manual' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <p className="text-sm">{task.source_connector}</p>
                </div>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(parseISO(task.created_at), 'PPp')}</p>
                <p>Updated: {format(parseISO(task.updated_at), 'PPp')}</p>
                {task.completed_at && (
                  <p>Completed: {format(parseISO(task.completed_at), 'PPp')}</p>
                )}
              </div>

              <Separator />

              {/* Quick status buttons */}
              <div className="flex gap-2">
                {task.status !== 'in_progress' && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatusChange('in_progress')}>
                    Mark In Progress
                  </Button>
                )}
                {task.status !== 'done' && (
                  <Button size="sm" className="flex-1" onClick={() => handleStatusChange('done')}>
                    Mark Done
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No task selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
