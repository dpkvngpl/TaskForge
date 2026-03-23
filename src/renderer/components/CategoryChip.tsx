import React from 'react';

interface CategoryChipProps {
  category: string | null;
}

export function CategoryChip({ category }: CategoryChipProps) {
  if (!category) return null;

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">
      {category}
    </span>
  );
}
