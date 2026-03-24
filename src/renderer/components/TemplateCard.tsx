import React from 'react';
import { CategoryChip } from './CategoryChip';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@shared/constants';
import type { TaskTemplate } from '@shared/types';

interface TemplateCardProps {
  template: TaskTemplate;
  onUse: () => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const priority = template.template_data?.priority ?? 2;
  const category = template.template_data?.category ?? null;
  const description = template.template_data?.description ?? null;

  return (
    <div className="p-4 rounded-[8px] border-2 border-dashed border-[rgba(255,255,255,0.06)] bg-[#1a1d27] hover:border-[rgba(255,255,255,0.12)] transition-colors">
      <h3 className="text-sm font-semibold text-[#e2e2e6]">{template.name}</h3>
      {description && (
        <p className="text-xs text-[#a5a5af] mt-1 line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
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
        <CategoryChip category={category} />
        <button
          onClick={onUse}
          className="text-[10px] text-[#a5b4fc] hover:text-[#6366f1] ml-auto transition-colors"
        >
          Use template
        </button>
      </div>
    </div>
  );
}
