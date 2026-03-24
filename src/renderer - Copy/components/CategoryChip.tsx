import React from 'react';

interface CategoryChipProps {
  category: string | null;
}

const categoryColors: Record<string, string> = {
  'job-search': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'ipcos': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'personal': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'technical': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'admin': 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

export function CategoryChip({ category }: CategoryChipProps) {
  if (!category) return null;

  const colors = categoryColors[category] ?? 'bg-white/5 text-gray-400 border-white/5';

  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors}`}>
      {category}
    </span>
  );
}
