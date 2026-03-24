import React, { useState, useEffect } from 'react';
import { useViewStore } from '@/stores/view-store';
import { useTaskStore } from '@/stores/task-store';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_COLORS, PRIORITY_LABELS, SCHEDULED_SLOTS } from '@shared/constants';
import type { TaskPriority, NewTask } from '@shared/types';

const estPresets = [
  { label: '15m', mins: 15 },
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '2h', mins: 120 },
  { label: '4h', mins: 240 },
];

export function TaskForm() {
  const { isTaskFormOpen, editingTaskId, closeTaskForm } = useViewStore();
  const { createTask, updateTask, tasks } = useTaskStore();
  const categories = useSettingsStore((s) => s.settings.categories);

  const existingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('todo');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMins, setEstimatedMins] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setStatus(existingTask.status);
      setPriority(existingTask.priority);
      setDueDate(existingTask.due_date || '');
      setDueTime(existingTask.due_time || '');
      setEstimatedMins(existingTask.estimated_mins);
      setCategory(existingTask.category);
      setTags(existingTask.tags || []);
      setScheduledDate(existingTask.scheduled_date || '');
      setScheduledSlot(existingTask.scheduled_slot);
    } else {
      // Reset for new task
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority(2);
      setDueDate('');
      setDueTime('');
      setEstimatedMins(null);
      setCategory(null);
      setTags([]);
      setScheduledDate('');
      setScheduledSlot(null);
    }
    setError('');
  }, [existingTask, isTaskFormOpen]);

  if (!isTaskFormOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const taskData: NewTask = {
      title: title.trim(),
      description: description || null,
      status: status as any,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      estimated_mins: estimatedMins,
      category,
      tags,
      scheduled_date: scheduledDate || null,
      scheduled_slot: scheduledSlot,
    };

    if (editingTaskId) {
      await updateTask(editingTaskId, taskData);
    } else {
      await createTask(taskData);
    }
    closeTaskForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeTaskForm();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === e.currentTarget) closeTaskForm(); }}
    >
      <div className="surface w-[520px] max-h-[620px] rounded-xl border border-white/[0.06] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-medium text-zinc-200">
            {editingTaskId ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={closeTaskForm} className="text-zinc-500 hover:text-zinc-400 p-1 rounded hover:bg-white/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <Field label="Title" error={error}>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="What needs to be done?"
              className="form-input"
              autoFocus
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or context..."
              className="form-input min-h-[64px] resize-y"
              rows={3}
            />
          </Field>

          {/* Status + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={category || ''} onChange={(e) => setCategory(e.target.value || null)} className="form-input">
                <option value="">None</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Priority */}
          <Field label="Priority">
            <div className="grid grid-cols-4 gap-1">
              {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium border transition-all ${
                    priority === p
                      ? p === 3 ? 'bg-red-500/15 border-red-500/30 text-red-300'
                        : p === 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : p === 1 ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                        : 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400'
                      : 'surface-elevated border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </Field>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input text-[12px]" />
            </Field>
            <Field label="Due time">
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="form-input text-[12px]" />
            </Field>
          </div>

          {/* Estimated time */}
          <Field label="Estimated time">
            <div className="flex items-center gap-1">
              {estPresets.map(({ label, mins }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setEstimatedMins(estimatedMins === mins ? null : mins)}
                  className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                    estimatedMins === mins
                      ? 'bg-indigo-500/12 border-indigo-500/30 text-indigo-300'
                      : 'surface-elevated border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <input
                type="number"
                value={estimatedMins || ''}
                onChange={(e) => setEstimatedMins(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="mins"
                className="form-input w-16 text-center text-[12px]"
              />
              <span className="text-[11px] text-zinc-600">mins</span>
            </div>
          </Field>

          {/* Tags */}
          <Field label="Tags">
            <div className="flex flex-wrap gap-1 surface-elevated rounded-lg border border-white/[0.06] p-1.5 min-h-[36px] focus-within:border-indigo-500/40">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 bg-indigo-500/15 text-indigo-300 text-[11px] px-2 py-0.5 rounded">
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-indigo-400 hover:text-indigo-200"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder={tags.length === 0 ? 'Type and press Enter...' : ''}
                className="flex-1 min-w-[60px] bg-transparent text-[12px] text-zinc-300 placeholder-zinc-600 outline-none"
              />
            </div>
          </Field>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* Schedule */}
          <Field label="Schedule">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="form-input w-[150px] text-[12px]"
              />
              <div className="flex gap-1">
                {SCHEDULED_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setScheduledSlot(scheduledSlot === slot ? null : slot)}
                    className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors capitalize ${
                      scheduledSlot === slot
                        ? 'bg-indigo-500/12 border-indigo-500/30 text-indigo-300'
                        : 'surface-elevated border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
          <span className="text-[11px] text-zinc-700 flex items-center gap-1">
            <kbd className="bg-white/5 px-1 py-px rounded text-[10px] text-zinc-600">Esc</kbd> cancel
            <span className="mx-1.5 text-zinc-800">|</span>
            <kbd className="bg-white/5 px-1 py-px rounded text-[10px] text-zinc-600">Ctrl</kbd>+
            <kbd className="bg-white/5 px-1 py-px rounded text-[10px] text-zinc-600">Enter</kbd> save
          </span>
          <div className="flex gap-2">
            <button
              onClick={closeTaskForm}
              className="px-4 py-1.5 rounded-lg text-[13px] border border-white/[0.06] text-zinc-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg text-[13px] bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
            >
              {editingTaskId ? 'Save changes' : 'Save task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-zinc-400">{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
