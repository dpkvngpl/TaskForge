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
  const loadTasks = useTaskStore((s) => s.loadTasks);
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

        {/* Connections */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Connections</h2>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <span className="text-sm font-medium">Outlook Email</span>
              </div>
              <OutlookStatus />
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Client ID (from Azure AD)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="outlook-client-id"
                    placeholder="Paste your Azure App Client ID"
                    className="text-xs"
                    defaultValue=""
                    onBlur={(e) => {
                      if (e.target.value) {
                        window.taskforge.settings.set('outlook_client_id', e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await window.taskforge.connectors.authenticate('outlook');
                  } catch (err) {
                    console.error('Auth failed:', err);
                  }
                }}>Connect</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  await window.taskforge.connectors.deauthenticate('outlook');
                }}>Disconnect</Button>
              </div>
            </div>
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
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleExport}>Export JSON</Button>
            <Button variant="outline" size="sm" onClick={async () => {
              const csv = await window.taskforge.data.exportCSV();
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `taskforge-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={async () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const text = await file.text();
                const result = await window.taskforge.data.importJSON(text);
                alert(`Imported ${result.imported} tasks`);
                loadTasks();
              };
              input.click();
            }}>Import JSON</Button>
          </div>
        </section>

        <Separator />

        {/* About & Keyboard Shortcuts */}
        <section>
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <div className="text-sm text-muted-foreground space-y-1 mb-4">
            <p>TaskForge v{appVersion || '1.0.0'}</p>
            <p>Built with Electron + React + SQLite</p>
            <p>Local-first task planner and scheduler</p>
            <p className="text-xs mt-2">Data location: {dataPath}</p>
          </div>
          <h3 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between"><span>Quick add task</span><kbd className="bg-muted px-1.5 rounded">Ctrl+N</kbd></div>
            <div className="flex justify-between"><span>Undo last action</span><kbd className="bg-muted px-1.5 rounded">Ctrl+Z</kbd></div>
            <div className="flex justify-between"><span>Switch views</span><kbd className="bg-muted px-1.5 rounded">Ctrl+1-5</kbd></div>
            <div className="flex justify-between"><span>Set priority (selected task)</span><kbd className="bg-muted px-1.5 rounded">1-4</kbd></div>
            <div className="flex justify-between"><span>Close dialog/panel</span><kbd className="bg-muted px-1.5 rounded">Escape</kbd></div>
            <div className="flex justify-between"><span>Save task form</span><kbd className="bg-muted px-1.5 rounded">Ctrl+Enter</kbd></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function OutlookStatus() {
  const [status, setStatus] = React.useState<'checking' | 'connected' | 'disconnected'>('checking');

  React.useEffect(() => {
    window.taskforge.connectors.list().then((connectors: any[]) => {
      const outlook = connectors.find((c) => c.id === 'outlook');
      setStatus(outlook?.authenticated ? 'connected' : 'disconnected');
    });
  }, []);

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
      status === 'connected' ? 'bg-green-500/15 text-green-400' :
      status === 'disconnected' ? 'bg-red-500/15 text-red-400' :
      'bg-gray-500/15 text-gray-400'
    }`}>
      {status === 'checking' ? '...' : status === 'connected' ? 'Connected' : 'Not connected'}
    </span>
  );
}
