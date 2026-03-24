import React, { useState, useRef, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search tasks...', className = '' }: SearchBarProps) {
  const [value, setValue] = useState('');
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setSearchQuery(newValue);
      }, 300);
    },
    [setSearchQuery]
  );

  const handleClear = () => {
    setValue('');
    setSearchQuery('');
  };

  return (
    <div className={`flex items-center gap-1.5 surface-elevated rounded-md border border-white/[0.06] px-2.5 py-1.5 focus-within:border-indigo-500/40 transition-colors ${className}`}>
      <svg className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[12px] text-zinc-300 placeholder-zinc-600 outline-none"
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
