import React, { useState, useEffect, useMemo } from 'react';
import { RecurrenceCard } from '@/components/RecurrenceCard';
import { TemplateCard } from '@/components/TemplateCard';
import { RecurrenceEditDialog } from '@/components/RecurrenceEditDialog';
import type { TaskTemplate } from '@shared/types';

export function RecurringView() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadTemplates = async () => {
    const all = await window.taskforge.templates.getAll();
    setTemplates(all);
  };

  useEffect(() => { loadTemplates(); }, []);

  // Split: recurring (have recurrence_rule) vs plain templates (no recurrence_rule)
  const recurringTemplates = useMemo(
    () => templates.filter((t) => t.recurrence_rule),
    [templates]
  );
  const plainTemplates = useMemo(
    () => templates.filter((t) => !t.recurrence_rule),
    [templates]
  );

  const activeCount = recurringTemplates.filter((t) => t.is_active).length;
  const pausedCount = recurringTemplates.filter((t) => !t.is_active).length;

  // Get upcoming generated dates
  const [upcomingList, setUpcomingList] = useState<{ name: string; date: string }[]>([]);
  useEffect(() => {
    const fetchUpcoming = async () => {
      const results: { name: string; date: string }[] = [];
      for (const t of recurringTemplates.filter((t) => t.is_active && t.recurrence_rule)) {
        const dates = await window.taskforge.recurrence.getNextDates(t.recurrence_rule!, 2);
        for (const d of dates) {
          results.push({ name: t.name, date: d });
        }
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

  const handleUseTemplate = async (id: string) => {
    await window.taskforge.templates.createTaskFromTemplate(id);
    // Could show a toast here
  };

  const handleCreateRecurring = async (data: {
    name: string;
    template_data: Record<string, unknown>;
    recurrence_rule: string;
    is_active: boolean;
  }) => {
    await window.taskforge.templates.create(data);
    loadTemplates();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-lg font-bold"><span className="text-[#6366f1]">Task</span><span className="text-[#e2e2e6]">Forge</span></span>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#6366f1] text-white hover:bg-[#5558e6] flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          New recurring task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-6 p-6">
          {/* Left: Recurring tasks */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Active Recurring Tasks</h2>
              <span className="text-xs text-[#6b7280] bg-[rgba(255,255,255,0.06)] rounded-full px-2 py-0.5">{recurringTemplates.length}</span>
            </div>
            <div className="space-y-3">
              {recurringTemplates.length === 0 && (
                <div className="p-6 rounded-[8px] bg-[#1a1d27] border border-[rgba(255,255,255,0.06)] text-center text-[#6b7280] text-sm">
                  No recurring tasks yet. Click "+ New recurring task" to create one.
                </div>
              )}
              {recurringTemplates.map((t) => (
                <RecurrenceCard
                  key={t.id}
                  template={t}
                  onToggle={() => handleToggle(t.id, t.is_active)}
                  onClick={() => {/* TODO: edit dialog */}}
                />
              ))}
            </div>
          </div>

          {/* Right sidebar: Templates + Upcoming */}
          <div className="w-[280px] shrink-0">
            {/* Templates */}
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af]">Templates</h2>
              <span className="text-xs text-[#6b7280] bg-[rgba(255,255,255,0.06)] rounded-full px-2 py-0.5">{plainTemplates.length}</span>
            </div>
            <div className="space-y-3">
              {plainTemplates.length === 0 && (
                <div className="p-4 rounded-[8px] border-2 border-dashed border-[rgba(255,255,255,0.06)] text-center text-[#6b7280] text-xs">
                  No templates yet
                </div>
              )}
              {plainTemplates.map((t) => (
                <TemplateCard key={t.id} template={t} onUse={() => handleUseTemplate(t.id)} />
              ))}
            </div>

            {/* Upcoming generated */}
            {upcomingList.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a5a5af] mb-3">Upcoming Generated</h2>
                <div className="space-y-2">
                  {upcomingList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#e2e2e6] truncate">{item.name}</span>
                      <span className="text-[#6b7280] shrink-0 ml-2">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#6b7280]">
        {activeCount} active rule{activeCount !== 1 ? 's' : ''} · {pausedCount} paused
      </div>

      <RecurrenceEditDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleCreateRecurring}
      />
    </div>
  );
}
