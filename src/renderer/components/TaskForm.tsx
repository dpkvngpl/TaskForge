import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, SCHEDULED_SLOTS } from '@shared/constants';
import type { TaskPriority, TaskStatus, NewTask } from '@shared/types';

export function TaskForm() {
  const { isTaskFormOpen, editingTaskId, closeTaskForm } = useViewStore();
  const { tasks, createTask, updateTask } = useTaskStore();
  const categories = useSettingsStore((s) => s.settings.categories);

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;
  const isEditing = !!editingTask;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMins, setEstimatedMins] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [recurrencePreset, setRecurrencePreset] = useState('');
  const [titleError, setTitleError] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? '');
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setDueDate(editingTask.due_date ?? '');
      setDueTime(editingTask.due_time ?? '');
      setEstimatedMins(editingTask.estimated_mins?.toString() ?? '');
      setCategory(editingTask.category ?? '');
      setTags([...editingTask.tags]);
      setScheduledDate(editingTask.scheduled_date ?? '');
      setScheduledSlot(editingTask.scheduled_slot ?? '');
      setRecurrencePreset(editingTask.recurrence_rule ?? '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority(2);
      setDueDate('');
      setDueTime('');
      setEstimatedMins('');
      setCategory('');
      setTags([]);
      setScheduledDate('');
      setScheduledSlot('');
      setRecurrencePreset('');
    }
    setTitleError(false);
  }, [editingTask, isTaskFormOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    const taskData: NewTask = {
      title: title.trim(),
      description: description || null,
      status,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      estimated_mins: estimatedMins ? parseInt(estimatedMins, 10) : null,
      category: category || null,
      tags,
      scheduled_date: scheduledDate || null,
      scheduled_slot: scheduledSlot || null,
      recurrence_rule: recurrencePreset || null,
    };

    if (isEditing && editingTaskId) {
      await updateTask(editingTaskId, taskData);
    } else {
      await createTask(taskData);
    }
    closeTaskForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSave();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={isTaskFormOpen} onOpenChange={(open) => !open && closeTaskForm()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
              placeholder="Task title"
              className={titleError ? 'border-red-500' : ''}
              autoFocus
            />
            {titleError && <p className="text-xs text-red-500 mt-1">Title is required</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          {/* Status + Priority row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label>Priority</Label>
              <div className="flex gap-1 mt-1">
                {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 h-8 text-xs rounded-md border transition-colors ${
                      priority === p
                        ? 'border-2 font-semibold text-white'
                        : 'border-input text-muted-foreground hover:bg-accent/50'
                    }`}
                    style={priority === p ? { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] } : {}}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date + time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input id="dueTime" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          {/* Estimated time */}
          <div>
            <Label htmlFor="estimated">Estimated Time (minutes)</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="estimated"
                type="number"
                value={estimatedMins}
                onChange={(e) => setEstimatedMins(e.target.value)}
                placeholder="mins"
                className="w-24"
              />
              {[15, 30, 60, 120].map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setEstimatedMins(String(m))}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} &times;
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter"
            />
          </div>

          {/* Scheduled date + slot */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input id="scheduledDate" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Scheduled Slot</Label>
              <select
                value={scheduledSlot}
                onChange={(e) => setScheduledSlot(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">None</option>
                {SCHEDULED_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence (Repeat) */}
          <div>
            <Label>Repeat</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[
                { label: 'None', value: '' },
                { label: 'Daily', value: 'FREQ=DAILY' },
                { label: 'Weekdays', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
                { label: 'Weekly', value: 'FREQ=WEEKLY' },
                { label: 'Monthly', value: 'FREQ=MONTHLY' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setRecurrencePreset(preset.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    recurrencePreset === preset.value
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'border-input text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeTaskForm}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Task'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
