import React from 'react';

interface CategoryChipProps {
  category: string | null;
  size?: 'sm' | 'md';
}

export function CategoryChip({ category, size = 'sm' }: CategoryChipProps) {
  if (!category) return null;

  const sizeClass = size === 'sm'
    ? 'px-1.5 py-0.5 text-[11px]'
    : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-block rounded ${sizeClass} bg-indigo-500/10 text-indigo-300`}>
      {category}
    </span>
  );
}
