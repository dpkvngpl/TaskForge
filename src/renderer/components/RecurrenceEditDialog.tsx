import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DayCircles } from './DayCircles';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS, SCHEDULED_SLOTS } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

interface RecurrenceEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    template_data: Record<string, unknown>;
    recurrence_rule: string;
    is_active: boolean;
  }) => void;
}

const PRESETS: { label: string; freq: string; days?: number[] }[] = [
  { label: 'Daily', freq: 'FREQ=DAILY' },
  { label: 'Weekdays', freq: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', days: [0, 1, 2, 3, 4] },
  { label: 'Weekly', freq: 'FREQ=WEEKLY' },
  { label: 'Fortnightly', freq: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Monthly', freq: 'FREQ=MONTHLY' },
];

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export function RecurrenceEditDialog({ open, onClose, onSave }: RecurrenceEditDialogProps) {
  const categories = useSettingsStore((s) => s.settings.categories);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [category, setCategory] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [estimatedMins, setEstimatedMins] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [nameError, setNameError] = useState(false);

  const toggleDay = (day: number) => {
    setCustomDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    setSelectedPreset('custom');
  };

  const handleSave = () => {
    if (!name.trim()) { setNameError(true); return; }

    let rule = selectedPreset;
    if (selectedPreset === 'custom' && customDays.length > 0) {
      const dayStr = customDays.sort().map((d) => DAY_CODES[d]).join(',');
      rule = `FREQ=WEEKLY;BYDAY=${dayStr}`;
    }
    if (!rule) { rule = 'FREQ=WEEKLY'; }

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

    // Reset
    setName(''); setDescription(''); setPriority(2); setCategory('');
    setScheduledSlot(''); setEstimatedMins(''); setSelectedPreset(''); setCustomDays([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Recurring Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }} placeholder="Task name" className={nameError ? 'border-red-500' : ''} autoFocus />
            {nameError && <p className="text-xs text-red-500 mt-1">Name is required</p>}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Priority</Label>
              <div className="flex gap-1 mt-1">
                {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`flex-1 h-8 text-xs rounded-[6px] border transition-colors ${priority === p ? 'border-2 font-semibold text-white' : 'border-[rgba(255,255,255,0.06)] text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)]'}`}
                    style={priority === p ? { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] } : {}}
                  >{PRIORITY_LABELS[p]}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 rounded-[6px] border border-[rgba(255,255,255,0.06)] bg-[#0f1117] px-3 text-sm text-[#e2e2e6] mt-1">
                <option value="">None</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Recurrence presets */}
          <div>
            <Label>Recurrence</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESETS.map((preset) => (
                <button key={preset.freq} onClick={() => { setSelectedPreset(preset.freq); if (preset.days) setCustomDays(preset.days); }}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                    selectedPreset === preset.freq
                      ? 'bg-[#6366f1] text-white border-[#6366f1]'
                      : 'border-[rgba(255,255,255,0.06)] text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >{preset.label}</button>
              ))}
              <button onClick={() => setSelectedPreset('custom')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                  selectedPreset === 'custom'
                    ? 'bg-[#6366f1] text-white border-[#6366f1]'
                    : 'border-[rgba(255,255,255,0.06)] text-[#a5a5af] hover:bg-[rgba(255,255,255,0.06)]'
                }`}
              >Custom</button>
            </div>
          </div>

          {/* Custom day picker */}
          {(selectedPreset === 'custom' || selectedPreset.includes('WEEKLY')) && (
            <div>
              <Label>Days of week</Label>
              <div className="mt-1">
                <DayCircles activeDays={customDays} />
                <div className="flex gap-1.5 mt-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((_, i) => (
                    <button key={i} onClick={() => toggleDay(i)} className="w-6 h-1 rounded-full bg-transparent" />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Scheduled Slot</Label>
              <select value={scheduledSlot} onChange={(e) => setScheduledSlot(e.target.value)} className="w-full h-9 rounded-[6px] border border-[rgba(255,255,255,0.06)] bg-[#0f1117] px-3 text-sm text-[#e2e2e6]">
                <option value="">None</option>
                {SCHEDULED_SLOTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <Label>Estimated Time</Label>
              <Input type="number" value={estimatedMins} onChange={(e) => setEstimatedMins(e.target.value)} placeholder="minutes" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Create Recurring Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
