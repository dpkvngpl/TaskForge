import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/stores/task-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { TaskPriority } from '@shared/types';

export function QuickAddBar() {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useTaskStore((s) => s.createTask);
  const settings = useSettingsStore((s) => s.settings);

  // Listen for quick-add trigger (Ctrl+N or tray)
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('taskforge:quick-add', handler);
    return () => window.removeEventListener('taskforge:quick-add', handler);
  }, []);

  const handleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      await createTask({
        title: title.trim(),
        status: 'todo',
        priority: (settings.defaultPriority ?? 2) as TaskPriority,
        category: settings.defaultCategory ?? null,
      });
      setTitle('');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleSubmit}
        placeholder="Add a task... (press Enter)"
        className="h-9"
      />
    </div>
  );
}
