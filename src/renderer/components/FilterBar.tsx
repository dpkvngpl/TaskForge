import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { useTaskStore } from '@/stores/task-store';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

export function FilterBar() {
  const { filters, setFilters, clearFilters } = useTaskStore();
  const categories = useSettingsStore((s) => s.settings.categories);

  const hasFilters = !!(filters.category || filters.priority !== undefined);

  return (
    <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap">
      {/* Category filter */}
      <select
        value={filters.category ?? ''}
        onChange={(e) => setFilters({ category: e.target.value || undefined })}
        className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority !== undefined ? String(filters.priority) : ''}
        onChange={(e) => {
          const val = e.target.value;
          setFilters({ priority: val ? (parseInt(val) as TaskPriority) : undefined });
        }}
        className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground"
      >
        <option value="">All Priorities</option>
        {([3, 2, 1, 0] as TaskPriority[]).map((p) => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>

      {/* Active filter badges */}
      {filters.category && (
        <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters({ category: undefined })}>
          {filters.category} &times;
        </Badge>
      )}
      {filters.priority !== undefined && (
        <Badge
          variant="secondary"
          className="text-xs cursor-pointer"
          onClick={() => setFilters({ priority: undefined })}
          style={{ borderLeft: `3px solid ${PRIORITY_COLORS[filters.priority as TaskPriority]}` }}
        >
          {PRIORITY_LABELS[filters.priority as TaskPriority]} &times;
        </Badge>
      )}

      {/* Clear all */}
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
          Clear all
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="w-48">
        <SearchBar />
      </div>
    </div>
  );
}
