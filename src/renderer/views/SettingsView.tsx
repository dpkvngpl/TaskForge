import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/stores/settings-store';
import { useTaskStore } from '@/stores/task-store';
import { PRIORITY_LABELS } from '@shared/constants';
import type { TaskPriority } from '@shared/types';

export function SettingsView() {
  const { settings, updateSetting } = useSettingsStore();
  const tasks = useTaskStore((s) => s.tasks);
  const [newCategory, setNewCategory] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [dataPath, setDataPath] = useState('');

  useEffect(() => {
    window.taskforge.app.getVersion().then(setAppVersion);
    window.taskforge.app.getDataPath().then(setDataPath);
  }, []);

  // Theme
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updateSetting('theme', theme);
    // Apply theme class
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  };

  // Categories
  const handleAddCategory = async () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      const updated = [...settings.categories, newCategory.trim()];
      await updateSetting('categories', updated);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    const updated = settings.categories.filter((c) => c !== cat);
    await updateSetting('categories', updated);
  };

  // Export
  const handleExport = async () => {
    const allTasks = await window.taskforge.tasks.getAll();
    const data = JSON.stringify(allTasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskforge-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Appearance</h2>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((theme) => (
              <Button
                key={theme}
                variant={settings.theme === theme ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Defaults */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Defaults</h2>
          <div className="space-y-4">
            <div>
              <Label>Default Priority</Label>
              <select
                value={settings.defaultPriority}
                onChange={(e) => updateSetting('defaultPriority', parseInt(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground mt-1"
              >
                {([0, 1, 2, 3] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Default Category</Label>
              <select
                value={settings.defaultCategory ?? ''}
                onChange={(e) => updateSetting('defaultCategory', e.target.value || null)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground mt-1"
              >
                <option value="">None</option>
                {settings.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <Separator />

        {/* Categories */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-sm cursor-pointer" onClick={() => handleRemoveCategory(cat)}>
                {cat} &times;
              </Badge>
            ))}
            {settings.categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="New category name"
              className="flex-1"
            />
            <Button onClick={handleAddCategory} size="sm">Add</Button>
          </div>
        </section>

        <Separator />

        {/* Data */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Data</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Database:</span> {dataPath}/taskforge.db</p>
            <p><span className="text-muted-foreground">Backup:</span> {dataPath}/taskforge.db.bak</p>
            <p><span className="text-muted-foreground">Total tasks:</span> {tasks.length}</p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleExport}>
            Export to JSON
          </Button>
        </section>

        <Separator />

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>TaskForge v{appVersion || '1.0.0'}</p>
            <p>Built with Electron + React</p>
            <p>Local-first task planner and scheduler</p>
          </div>
        </section>
      </div>
    </div>
  );
}
