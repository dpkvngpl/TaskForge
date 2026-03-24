import React from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { DEFAULT_CATEGORIES, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS } from '@shared/constants';
import type { Task, TaskPriority, TaskStatus } from '@shared/types';

interface TaskContextMenuProps {
  task: Task;
  position: { x: number; y: number };
  onClose: () => void;
}

export function TaskContextMenu({ task, position, onClose }: TaskContextMenuProps) {
  const { updateTask, deleteTask, createTask } = useTaskStore();
  const { openTaskForm } = useViewStore();

  const handleAction = async (action: () => Promise<void> | void) => {
    await action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 surface rounded-xl border border-white/[0.08] py-1.5 min-w-[200px] shadow-2xl"
        style={{ top: position.y, left: position.x }}
      >
        <MenuItem
          label="Edit task"
          icon={<EditIcon />}
          onClick={() => handleAction(() => { openTaskForm(task.id); })}
        />
        <MenuItem
          label="Duplicate"
          icon={<CopyIcon />}
          onClick={() => handleAction(async () => {
            await createTask({
              title: `${task.title} (Copy)`,
              description: task.description,
              priority: task.priority,
              category: task.category,
              tags: task.tags,
              due_date: task.due_date,
              due_time: task.due_time,
              estimated_mins: task.estimated_mins,
            });
          })}
        />

        <Divider />

        {/* Priority submenu */}
        <SubMenuLabel label="Set priority" />
        <div className="px-2 pb-1 flex gap-1">
          {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => handleAction(() => updateTask(task.id, { priority: p }))}
              className={`flex-1 py-1 rounded-md text-[11px] text-center transition-colors ${
                task.priority === p
                  ? 'ring-1 ring-white/20 bg-white/10'
                  : 'hover:bg-white/5'
              }`}
              title={PRIORITY_LABELS[p]}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
            </button>
          ))}
        </div>

        {/* Category submenu */}
        <SubMenuLabel label="Set category" />
        <div className="px-2 pb-1 flex flex-wrap gap-1">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleAction(() => updateTask(task.id, { category: cat }))}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                task.category === cat
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'bg-white/5 text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Divider />

        {/* Move to */}
        <SubMenuLabel label="Move to" />
        <div className="px-2 pb-1 space-y-0.5">
          {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleAction(() => updateTask(task.id, { status: s }))}
              className={`w-full text-left px-2 py-1 rounded-md text-[12px] transition-colors ${
                task.status === s ? 'text-indigo-300 bg-indigo-500/10' : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <Divider />

        <MenuItem
          label="Schedule for today"
          icon={<CalendarIcon />}
          onClick={() => handleAction(() =>
            updateTask(task.id, { scheduled_date: new Date().toISOString().split('T')[0] })
          )}
        />

        <Divider />

        <MenuItem
          label="Delete"
          icon={<TrashIcon />}
          danger
          onClick={() => handleAction(async () => {
            if (window.confirm(`Delete "${task.title}"?`)) {
              await deleteTask(task.id);
            }
          })}
        />
      </div>
    </>
  );
}

function MenuItem({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors ${
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-white/5'
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}

function SubMenuLabel({ label }: { label: string }) {
  return <div className="px-3 pt-1 pb-0.5 text-[10px] text-zinc-600 uppercase tracking-wide">{label}</div>;
}

function Divider() {
  return <div className="my-1 h-px bg-white/[0.04]" />;
}

// Inline SVG icons
function EditIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function CopyIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>;
}
function TrashIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
}
function CalendarIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
}
