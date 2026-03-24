import React, { useState, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useSettingsStore } from '@/stores/settings-store';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

export function FilterBar() {
  const { filters, setFilters, clearFilters, tasks } = useTaskStore();
  const categories = useSettingsStore((s) => s.settings.categories);
  const [searchValue, setSearchValue] = useState('');
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);

  // Debounced search
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setSearchQuery(value);
      }, 300);
    },
    [setSearchQuery]
  );

  const activeCategory = filters.category;
  const activePriority = filters.priority;
  const hasFilters = activeCategory || activePriority !== undefined || searchValue;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Category chips */}
      <button
        onClick={() => setFilters({ category: undefined })}
        className={`px-2.5 py-1 rounded-md text-[12px] border transition-colors ${
          !activeCategory
            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
            : 'surface border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
        }`}
      >
        All tasks
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setFilters({ category: activeCategory === cat ? undefined : cat })}
          className={`px-2.5 py-1 rounded-md text-[12px] border transition-colors ${
            activeCategory === cat
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
              : 'surface border-white/[0.06] text-zinc-500 hover:border-white/[0.1]'
          }`}
        >
          {cat}
        </button>
      ))}

      {/* Priority filter */}
      <div className="flex items-center gap-0.5 ml-1">
        {([3, 2, 1] as TaskPriority[]).map((p) => (
          <button
            key={p}
            onClick={() =>
              setFilters({
                priority: activePriority === p ? undefined : p,
              })
            }
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              activePriority === p
                ? 'bg-white/10 ring-1 ring-white/20'
                : 'hover:bg-white/5'
            }`}
            title={PRIORITY_LABELS[p]}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[p] }}
            />
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 surface-elevated rounded-md border border-white/[0.06] px-2 py-1 ml-auto">
        <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="bg-transparent text-[12px] text-zinc-300 placeholder-zinc-600 outline-none w-32"
        />
        {searchValue && (
          <button
            onClick={() => {
              handleSearch('');
            }}
            className="text-zinc-600 hover:text-zinc-400"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => {
            clearFilters();
            setSearchValue('');
          }}
          className="text-[11px] text-zinc-500 hover:text-zinc-400 ml-1"
        >
          Clear all
        </button>
      )}

      {/* Task count */}
      <span className="text-[12px] text-zinc-600 ml-1">{tasks.length} tasks</span>
    </div>
  );
}
