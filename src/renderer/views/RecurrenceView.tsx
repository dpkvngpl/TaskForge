import React, { useState, useEffect } from 'react';
import { useViewStore } from '@/stores/view-store';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { TaskForm } from '@/components/TaskForm';
import { CategoryChip } from '@/components/CategoryChip';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { TaskTemplate } from '@shared/types';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
      onClick={() => onChange(!active)}
      className={`toggle-track ${active ? 'active' : ''}`}
    >
      <div className="toggle-knob" />
    </button>
  );
}

interface RecurrenceCardData {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  category: string;
  priority: 0 | 1 | 2 | 3;
  nextDate: string;
  activeDays: number[];
}

// Mock data — replace with real template/recurrence data from store
const mockRecurrences: RecurrenceCardData[] = [
  { id: '1', title: 'Weekly review', description: 'Every Friday evening', isActive: true, category: 'admin', priority: 2, nextDate: 'Fri 27 Mar', activeDays: [4] },
  { id: '2', title: 'Daily planning', description: 'Every weekday morning', isActive: true, category: 'admin', priority: 1, nextDate: 'Tue 24 Mar', activeDays: [0, 1, 2, 3, 4] },
  { id: '3', title: 'Application follow-up check', description: 'Every Monday and Thursday', isActive: true, category: 'job-search', priority: 3, nextDate: 'Thu 26 Mar', activeDays: [0, 3] },
  { id: '4', title: 'Technical training — PTA/RTA exercises', description: 'Every Wednesday afternoon', isActive: false, category: 'technical', priority: 2, nextDate: 'Paused', activeDays: [2] },
];

const mockTemplates = [
  { id: 't1', name: 'Job application bundle', description: 'Creates 3 linked tasks: research company, tailor CV, write cover letter.', priority: 3, category: 'job-search' },
  { id: 't2', name: 'Technical deep-dive session', description: '2-hour focused study block. Pre-set with estimated time and afternoon slot.', priority: 2, category: 'technical' },
  { id: 't3', name: 'IPCOS client deliverable', description: 'Standard workflow: draft, internal review, client submission.', priority: 2, category: 'ipcos' },
];

const mockUpcoming = [
  { name: 'Daily planning', date: 'Tomorrow' },
  { name: 'App follow-up check', date: 'Thu 26' },
  { name: 'Weekly review', date: 'Fri 27' },
  { name: 'Daily planning', date: 'Fri 27' },
];

export function RecurrenceView() {
  const [recurrences, setRecurrences] = useState(mockRecurrences);

  const toggleRecurrence = (id: string, val: boolean) => {
    setRecurrences((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: val } : r)));
  };

  const activeCount = recurrences.filter((r) => r.isActive).length;
  const pausedCount = recurrences.filter((r) => !r.isActive).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <button className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[13px] hover:bg-indigo-500/25 transition-colors">
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
            <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{recurrences.length}</span>
          </div>

          <div className="space-y-2">
            {recurrences.map((rec) => (
              <div
                key={rec.id}
                className={`surface rounded-xl p-3.5 border border-white/[0.03] transition-all ${
                  rec.isActive ? '' : 'opacity-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[14px] font-medium text-zinc-200">{rec.title}</div>
                  <Toggle active={rec.isActive} onChange={(val) => toggleRecurrence(rec.id, val)} />
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                  <span className="text-[12px] text-zinc-400">{rec.description}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <CategoryChip category={rec.category} />
                  <PriorityBadge priority={rec.priority} variant="pill" />
                  <span className={`text-[11px] ${rec.isActive ? 'text-zinc-500' : 'text-zinc-700'}`}>
                    Next: {rec.nextDate}
                  </span>
                </div>

                <DayCircles activeDays={rec.activeDays} />
              </div>
            ))}
          </div>
        </div>

        {/* Templates sidebar */}
        <div className="w-[280px] border-l border-white/[0.04] overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide">Templates</span>
            <span className="text-[11px] text-zinc-600 bg-white/5 px-1.5 py-px rounded-full">{mockTemplates.length}</span>
          </div>

          <div className="space-y-2 mb-6">
            {mockTemplates.map((tmpl) => (
              <div key={tmpl.id} className="surface-elevated rounded-lg p-3 border border-dashed border-white/[0.06] hover:border-indigo-500/25 transition-colors cursor-pointer">
                <div className="text-[13px] font-medium text-zinc-200 mb-1">{tmpl.name}</div>
                <p className="text-[11px] text-zinc-500 leading-relaxed mb-2 line-clamp-2">{tmpl.description}</p>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={tmpl.priority as any} variant="pill" />
                  <CategoryChip category={tmpl.category} />
                  <button className="text-[11px] text-indigo-300 hover:underline ml-auto">Use template</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Upcoming generated</div>
            <div className="space-y-0">
              {mockUpcoming.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.03] text-[12px]">
                  <span className="text-zinc-500">{item.name}</span>
                  <span className="text-zinc-400">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-2 text-[12px] text-zinc-600 border-t border-white/[0.04]">
        <span className="text-indigo-300">{activeCount}</span> active &middot;{' '}
        <span className="text-indigo-300">{pausedCount}</span> paused &middot;{' '}
        <span className="text-indigo-300">{mockUpcoming.length}</span> tasks auto-generated this week
      </div>

      <TaskDetailPanel />
      <TaskForm />
    </div>
  );
}
