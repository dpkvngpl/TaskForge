import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS, SCHEDULED_SLOTS } from '@shared/constants';
import type { TaskPriority, TaskTemplate } from '@shared/types';

interface RecurrenceEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    template_data: Record<string, unknown>;
    recurrence_rule: string;
    is_active: boolean;
  }) => void;
  editingTemplate?: TaskTemplate | null;
}

const PRESETS: { label: string; value: string }[] = [
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekdays', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Fortnightly', value: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export function RecurrenceEditDialog({ open, onClose, onSave, editingTemplate }: RecurrenceEditDialogProps) {
  const categories = useSettingsStore((s) => s.settings.categories);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [category, setCategory] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [estimatedMins, setEstimatedMins] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [nameError, setNameError] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      const td = editingTemplate.template_data || {};
      setDescription((td.description as string) || '');
      setPriority((td.priority as TaskPriority) ?? 2);
      setCategory((td.category as string) || '');
      setScheduledSlot((td.scheduled_slot as string) || '');
      setEstimatedMins(td.estimated_mins ? String(td.estimated_mins) : '');
      setSelectedPreset(editingTemplate.recurrence_rule || '');
      // Parse active days from RRULE
      const days: number[] = [];
      const rule = editingTemplate.recurrence_rule || '';
      DAY_CODES.forEach((code, idx) => { if (rule.includes(code)) days.push(idx); });
      setCustomDays(days);
    } else {
      setName(''); setDescription(''); setPriority(2); setCategory('');
      setScheduledSlot(''); setEstimatedMins(''); setSelectedPreset(''); setCustomDays([]);
    }
    setNameError(false);
  }, [editingTemplate, open]);

  if (!open) return null;

  const toggleDay = (day: number) => {
    setCustomDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    setSelectedPreset('custom');
  };

  const handleSave = () => {
    if (!name.trim()) { setNameError(true); return; }

    let rule = selectedPreset;

    // For Weekly/Fortnightly — append selected days
    if ((selectedPreset.includes('WEEKLY')) && customDays.length > 0) {
      // Strip any existing BYDAY from preset, then add selected days
      const base = selectedPreset.replace(/;?BYDAY=[A-Z,]+/, '');
      const dayStr = [...customDays].sort().map((d) => DAY_CODES[d]).join(',');
      rule = `${base};BYDAY=${dayStr}`;
    }

    // For Custom — build from scratch
    if (selectedPreset === 'custom' && customDays.length > 0) {
      const dayStr = [...customDays].sort().map((d) => DAY_CODES[d]).join(',');
      rule = `FREQ=WEEKLY;BYDAY=${dayStr}`;
    }

    // For Monthly — add day of month
    if (selectedPreset === 'FREQ=MONTHLY') {
      rule = `FREQ=MONTHLY;BYMONTHDAY=${monthDay}`;
    }

    if (!rule) rule = 'FREQ=WEEKLY';

    onSave({
      name: name.trim(),
      template_data: {
        title: name.trim(),
        description: description || null,
        priority,
        category: category || null,
        estimated_mins: estimatedMins ? parseInt(estimatedMins, 10) : null,
        scheduled_slot: scheduledSlot || null,
      },
      recurrence_rule: rule,
      is_active: true,
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="surface w-[500px] max-h-[600px] rounded-xl border border-white/[0.06] flex flex-col shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && e.ctrlKey) handleSave(); }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <h2 className="text-[15px] font-medium text-zinc-200">
              {editingTemplate ? 'Edit recurring task' : 'New recurring task'}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-400 p-1 rounded hover:bg-white/5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Name *</label>
              <input value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }} placeholder="Task name" className={`form-input ${nameError ? 'border-red-500' : ''}`} autoFocus />
              {nameError && <span className="text-[11px] text-red-400 mt-1 block">Name is required</span>}
            </div>

            {/* Description */}
            <div>
              <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="form-input min-h-[48px] resize-y" rows={2} />
            </div>

            {/* Priority + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Priority</label>
                <div className="grid grid-cols-4 gap-1">
                  {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                    <button key={p} type="button" onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-md text-[11px] font-medium border transition-all text-center ${
                        priority === p
                          ? p === 3 ? 'bg-red-500/15 border-red-500/30 text-red-300'
                            : p === 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : p === 1 ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                            : 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400'
                          : 'bg-[#12141b] border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
                      }`}
                    >{PRIORITY_LABELS[p]}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                  <option value="">None</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Recurrence presets */}
            <div>
              <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Recurrence</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button key={preset.value} type="button" onClick={() => { setSelectedPreset(preset.value); }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      selectedPreset === preset.value
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-[#12141b] border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
                    }`}
                  >{preset.label}</button>
                ))}
              </div>
            </div>

            {/* Day-of-week picker — shown for Weekly, Fortnightly, and Custom */}
            {(selectedPreset.includes('WEEKLY') || selectedPreset === 'custom') && (
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Repeat on</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i)}
                      className={`w-8 h-8 rounded-full text-[11px] font-medium transition-colors ${
                        customDays.includes(i)
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-white/[0.03] text-zinc-600 border border-transparent hover:bg-white/[0.06]'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Day-of-month picker — shown for Monthly */}
            {selectedPreset === 'FREQ=MONTHLY' && (
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Day of month</label>
                <div className="flex items-center gap-2">
                  <select
                    value={monthDay}
                    onChange={(e) => setMonthDay(parseInt(e.target.value))}
                    className="form-input w-[80px]"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                    ))}
                  </select>
                  <span className="text-[12px] text-zinc-500">of every month</span>
                </div>
              </div>
            )}

            {/* Slot + Estimated time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Scheduled Slot</label>
                <select value={scheduledSlot} onChange={(e) => setScheduledSlot(e.target.value)} className="form-input">
                  <option value="">None</option>
                  {SCHEDULED_SLOTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Estimated Time (mins)</label>
                <input type="number" value={estimatedMins} onChange={(e) => setEstimatedMins(e.target.value)} placeholder="mins" className="form-input" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-[13px] border border-white/[0.06] text-zinc-400 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} className="px-5 py-1.5 rounded-lg text-[13px] bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors">
              {editingTemplate ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
