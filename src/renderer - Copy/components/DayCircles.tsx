import React from 'react';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DayCirclesProps {
  activeDays: number[]; // indices 0-6 (Mon-Sun) that are active
}

export function DayCircles({ activeDays }: DayCirclesProps) {
  return (
    <div className="flex gap-1.5">
      {LABELS.map((label, i) => {
        const isActive = activeDays.includes(i);
        return (
          <span
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
              isActive
                ? 'bg-[rgba(99,102,241,0.15)] text-[#a5b4fc] border border-[rgba(99,102,241,0.30)]'
                : 'bg-[rgba(255,255,255,0.06)] text-[#4b4b55]'
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
