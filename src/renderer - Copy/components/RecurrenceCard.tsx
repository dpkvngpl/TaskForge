import React, { useEffect, useState } from 'react';
import { CategoryChip } from './CategoryChip';
import { DayCircles } from './DayCircles';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@shared/constants';
import type { TaskTemplate } from '@shared/types';

interface RecurrenceCardProps {
  template: TaskTemplate;
  onToggle: () => void;
  onClick: () => void;
}

// Parse RRULE to get active day indices (0=Mon..6=Sun)
function getActiveDays(rule: string | null): number[] {
  if (!rule) return [];
  const dayMap: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
  const days: number[] = [];
  for (const [code, idx] of Object.entries(dayMap)) {
    if (rule.includes(code)) days.push(idx);
  }
  // If DAILY with no specific days, all days
  if (days.length === 0 && rule.includes('DAILY')) return [0, 1, 2, 3, 4, 5, 6];
  return days;
}

export function RecurrenceCard({ template, onToggle, onClick }: RecurrenceCardProps) {
  const [description, setDescription] = useState('');
  const [nextDates, setNextDates] = useState<string[]>([]);

  const activeDays = getActiveDays(template.recurrence_rule);
  const priority = template.template_data?.priority ?? 2;
  const category = template.template_data?.category ?? null;

  useEffect(() => {
    if (template.recurrence_rule) {
      window.taskforge.recurrence.describe(template.recurrence_rule).then(setDescription);
      window.taskforge.recurrence.getNextDates(template.recurrence_rule, 1).then(setNextDates);
    }
  }, [template.recurrence_rule]);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[8px] bg-[#1a1d27] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] cursor-pointer transition-all ${
        !template.is_active ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#e2e2e6]">{template.name}</h3>
          <p className="text-xs text-[#a5a5af] mt-1 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
            <span className="capitalize">{description || 'Loading...'}</span>
            {!template.is_active && <span className="text-[#4b4b55] ml-1">— paused</span>}
          </p>
        </div>
        {/* Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
            template.is_active ? 'bg-[#6366f1]' : 'bg-[#4b4b55]'
          }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${template.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-3">
        <CategoryChip category={category} />
        {priority > 0 && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border"
            style={{
              backgroundColor: `${PRIORITY_COLORS[priority as 0|1|2|3]}15`,
              color: PRIORITY_COLORS[priority as 0|1|2|3],
              borderColor: `${PRIORITY_COLORS[priority as 0|1|2|3]}30`,
            }}
          >
            {PRIORITY_LABELS[priority as 0|1|2|3]}
          </span>
        )}
        {nextDates.length > 0 && (
          <span className="text-[10px] text-[#6b7280] ml-auto">Next: {nextDates[0]}</span>
        )}
      </div>

      {/* Day circles */}
      {activeDays.length > 0 && (
        <div className="mt-3">
          <DayCircles activeDays={activeDays} />
        </div>
      )}
    </div>
  );
}
