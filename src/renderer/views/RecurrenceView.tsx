import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { RecurrenceEditDialog } from '@/components/RecurrenceEditDialog';
import { CategoryChip } from '@/components/CategoryChip';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { TaskTemplate } from '@shared/types';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_CODES: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };

function getActiveDays(rule: string | null): number[] {
  if (!rule) return [];
  const days: number[] = [];
  for (const [code, idx] of Object.entries(DAY_CODES)) {
    if (rule.includes(code)) days.push(idx);
  }
  if (days.length === 0 && rule.includes('DAILY')) return [0, 1, 2, 3, 4, 5, 6];
  return days;
}

function DayCircles({ activeDays }: { activeDays: number[] }) {
  return (
    <div className="flex gap-1 mt-2">
      {DAY_LABELS.map((label, i) => (
        <div
          key={i}
          className={`w-[22px] h-[22px] rounded-full text-[10px] flex items-center justify-center ${
            activeDays.includes(i)
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-white/[0.03] text-zinc-700'
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function Toggle({ active, onChange }: { active: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!active); }}
      className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
        active ? 'bg-indigo-500' : 'bg-zinc-700'
      }`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function RecurrenceCardItem({ template: tmpl, onEdit, onDelete, onToggle }: {
  template: TaskTemplate; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  const priority = (tmpl.template_data?.priority ?? 2) as 0 | 1 | 2 | 3;
  const category = (tmpl.template_data?.category as string) ?? null;
  const activeDays = getActiveDays(tmpl.recurrence_rule);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (tmpl.recurrence_rule) {
      window.taskforge.recurrence.describe(tmpl.recurrence_rule).then(setDesc).catch(() => setDesc(tmpl.recurrence_rule || ''));
    }
  }, [tmpl.recurrence_rule]);

  return (
    <div className={`surface rounded-xl p-3.5 border border-white/[0.03] transition-all ${tmpl.is_active ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[14px] font-medium text-zinc-200">{tmpl.name}</div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/5" title="Edit">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-white/5" title="Delete">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
          <Toggle active={tmpl.is_active} onChange={onToggle} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
        <span className="text-[12px] text-zinc-400 capitalize">{desc || 'Loading...'}</span>
        {!tmpl.is_active && <span className="text-[11px] text-zinc-600">— paused</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <CategoryChip category={category} />
        <PriorityBadge priority={priority} variant="pill" />
      </div>
      <DayCircles activeDays={activeDays} />
    </div>
  );
}

export function RecurrenceView() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  const loadTemplates = async () => {
    const all = await window.taskforge.templates.getAll();
    setTemplates(all);
  };

  useEffect(() => { loadTemplates(); }, []);

  const recurringTemplates = useMemo(() => templates.filter((t) => t.recurrence_rule), [templates]);
  const plainTemplates = useMemo(() => templates.filter((t) => !t.recurrence_rule), [templates]);
  const activeCount = recurringTemplates.filter((t) => t.is_active).length;
  const pausedCount = recurringTemplates.filter((t) => !t.is_active).length;

  // Upcoming dates
  const [upcomingList, setUpcomingList] = useState<{ name: string; date: string }[]>([]);
  useEffect(() => {
    const fetchUpcoming = async () => {
      const results: { name: string; date: string }[] = [];
      for (const t of recurringTemplates.filter((t) => t.is_active && t.recurrence_rule)) {
        try {
          const dates = await window.taskforge.recurrence.getNextDates(t.recurrence_rule!, 2);
          for (const d of dates) results.push({ name: t.name, date: d });
        } catch { /* ignore */ }
      }
      results.sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingList(results.slice(0, 6));
    };
    fetchUpcoming();
  }, [recurringTemplates]);

  const handleToggle = async (id: string, currentlyActive: boolean) => {
    await window.taskforge.templates.update(id, { is_active: !currentlyActive });
    loadTemplates();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete recurring task "${name}"?`)) {
      await window.taskforge.templates.delete(id);
      loadTemplates();
    }
  };

  const handleUseTemplate = async (id: string) => {
    await window.taskforge.templates.createTaskFromTemplate(id);
    alert('Task created from template');
  };

  const handleSaveRecurring = async (data: {
    name: string;
    template_data: Record<string, unknown>;
    recurrence_rule: string;
    is_active: boolean;
  }) => {
    if (editingTemplate) {
      // Update existing template
      await window.taskforge.templates.update(editingTemplate.id, data);
    } else {
      // Create new template + create first task instance immediately
      const tmpl = await window.taskforge.templates.create(data);
      // Also create an actual task so it shows in Kanban/Week/Focus
      await window.taskforge.tasks.create({
        title: data.name,
        description: (data.template_data.description as string) || null,
        priority: (data.template_data.priority as number) ?? 2,
        category: (data.template_data.category as string) || null,
        estimated_mins: (data.template_data.estimated_mins as number) || null,
        scheduled_slot: (data.template_data.scheduled_slot as string) || null,
        recurrence_rule: data.recurrence_rule,
        source_connector: 'template',
        source_id: tmpl.id,
        status: 'todo',
      } as any);
      // Reload task store so Kanban/Focus/Week pick it up
      useTaskStore.getState().loadTasks();
    }
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleEditClick = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleNewClick = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[22px] font-semibold text-zinc-100">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <button
          onClick={handleNewClick}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[13px] hover:bg-indigo-500/25 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New recurring task
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Recurring list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Active recurring tasks</span>
            <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{recurringTemplates.length}</span>
          </div>

          {recurringTemplates.length === 0 && (
            <div className="surface rounded-xl p-6 border border-white/[0.03] text-center text-zinc-600 text-[13px]">
              No recurring tasks yet. Click "+ New recurring task" to create one.
            </div>
          )}

          <div className="space-y-2">
            {recurringTemplates.map((tmpl) => (
              <RecurrenceCardItem
                key={tmpl.id}
                template={tmpl}
                onEdit={() => handleEditClick(tmpl)}
                onDelete={() => handleDelete(tmpl.id, tmpl.name)}
                onToggle={() => handleToggle(tmpl.id, tmpl.is_active)}
              />
            ))}
          </div>
        </div>

        {/* Templates sidebar */}
        <div className="w-[280px] border-l border-white/[0.04] overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Templates</span>
            <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{plainTemplates.length}</span>
          </div>

          <div className="space-y-2 mb-6">
            {plainTemplates.length === 0 && (
              <div className="surface-elevated rounded-lg p-3 border border-dashed border-white/[0.06] text-center text-zinc-600 text-[11px]">
                No templates yet
              </div>
            )}
            {plainTemplates.map((tmpl) => {
              const priority = (tmpl.template_data?.priority ?? 2) as 0 | 1 | 2 | 3;
              const category = (tmpl.template_data?.category as string) ?? null;
              const desc = (tmpl.template_data?.description as string) ?? null;
              return (
                <div key={tmpl.id} className="surface-elevated rounded-lg p-3 border border-dashed border-white/[0.06] hover:border-indigo-500/25 transition-colors">
                  <div className="text-[13px] font-medium text-zinc-200 mb-1">{tmpl.name}</div>
                  {desc && <p className="text-[11px] text-zinc-500 leading-relaxed mb-2 line-clamp-2">{desc}</p>}
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={priority} variant="pill" />
                    <CategoryChip category={category} />
                    <button onClick={() => handleUseTemplate(tmpl.id)} className="text-[11px] text-indigo-300 hover:underline ml-auto">Use template</button>
                  </div>
                </div>
              );
            })}
          </div>

          {upcomingList.length > 0 && (
            <div className="mt-5">
              <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Upcoming generated</div>
              <div className="space-y-0">
                {upcomingList.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.03] text-[12px]">
                    <span className="text-zinc-500">{item.name}</span>
                    <span className="text-zinc-400">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-2 text-[12px] text-zinc-600 border-t border-white/[0.04]">
        <span className="text-indigo-300">{activeCount}</span> active &middot;{' '}
        <span className="text-indigo-300">{pausedCount}</span> paused
      </div>

      {/* Dialogs */}
      <RecurrenceEditDialog
        open={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingTemplate(null); }}
        onSave={handleSaveRecurring}
        editingTemplate={editingTemplate}
      />
      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
