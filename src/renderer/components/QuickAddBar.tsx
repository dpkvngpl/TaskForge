import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { PRIORITY_COLORS, DEFAULT_CATEGORIES } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

export function QuickAddBar() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [category, setCategory] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useTaskStore((s) => s.createTask);

  // Listen for tray quick-add trigger
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('taskforge:quick-add', handler);
    return () => window.removeEventListener('taskforge:quick-add', handler);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    await createTask({
      title: trimmed,
      priority,
      category,
      status: 'todo',
    });

    setTitle('');
    setPriority(2);
    setCategory(null);
    setShowOptions(false);
  }, [title, priority, category, createTask]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      setShowOptions(false);
      inputRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length > 1) {
      e.preventDefault();
      // Batch entry - create tasks for each line
      const confirmed = window.confirm(`Create ${lines.length} tasks from pasted text?`);
      if (confirmed) {
        lines.forEach((line) => {
          createTask({ title: line, priority: 2, status: 'todo' });
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 flex items-center gap-2 surface-elevated rounded-lg px-3 py-1.5 border transition-colors ${
          showOptions ? 'border-indigo-500/40' : 'border-white/[0.06] hover:border-white/[0.1]'
        }`}
      >
        {/* Plus icon */}
        <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value && !showOptions) setShowOptions(true);
          }}
          onFocus={() => title && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Add a task... (Ctrl+N)"
          className="flex-1 bg-transparent text-[13px] text-zinc-200 placeholder-zinc-600 outline-none"
        />

        {/* Inline controls (visible when typing) */}
        {showOptions && (
          <>
            {/* Priority dots */}
            <div className="flex gap-0.5">
              {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    priority === p
                      ? 'bg-white/10 ring-1 ring-white/20'
                      : 'hover:bg-white/5'
                  }`}
                  title={['None', 'Low', 'Medium', 'High'][p]}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[p] }}
                  />
                </button>
              ))}
            </div>

            {/* Category quick-select */}
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value || null)}
              className="bg-[#12141b] border border-white/[0.06] rounded px-1.5 py-0.5 text-[11px] text-zinc-500 outline-none cursor-pointer appearance-none max-w-[90px]"
            >
              <option value="">Category</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </>
        )}

        {/* Enter hint */}
        {showOptions && title && (
          <span className="text-[10px] text-zinc-600 flex items-center gap-1 flex-shrink-0">
            <kbd className="bg-white/5 px-1 py-px rounded text-[9px] text-zinc-500">Enter</kbd>
          </span>
        )}
      </div>
    </div>
  );
}
