import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import type { TaskPriority } from '@shared/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-[14px] font-medium text-zinc-300 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 surface rounded-lg p-3.5 border border-white/[0.03]">
      <div className="flex-1">
        <div className="text-[13px] text-zinc-200">{label}</div>
        {description && <div className="text-[12px] text-zinc-500 mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { settings, updateSetting } = useSettingsStore();
  const [newCategory, setNewCategory] = useState('');

  const addCategory = () => {
    const cat = newCategory.trim().toLowerCase();
    if (cat && !settings.categories.includes(cat)) {
      updateSetting('categories', [...settings.categories, cat]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    updateSetting('categories', settings.categories.filter((c) => c !== cat));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04]">
        <div className="text-[15px] font-medium text-zinc-200">
          <span className="text-indigo-400">Task</span>Forge
        </div>
        <span className="text-[14px] text-zinc-500 ml-3">Settings</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[600px] mx-auto px-6 py-6">

          {/* Appearance */}
          <Section title="Appearance">
            <SettingRow label="Theme" description="Choose your preferred colour scheme">
              <div className="flex gap-1 surface-elevated rounded-md p-0.5">
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSetting('theme', t)}
                    className={`px-3 py-1.5 rounded text-[12px] capitalize transition-colors ${
                      settings.theme === t ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* Defaults */}
          <Section title="Defaults">
            <SettingRow label="Default priority" description="Priority assigned to new tasks from quick-add">
              <select
                value={settings.defaultPriority}
                onChange={(e) => updateSetting('defaultPriority', parseInt(e.target.value) as TaskPriority)}
                className="surface-elevated border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none"
              >
                <option value="0">None</option>
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </select>
            </SettingRow>
            <SettingRow label="Minimize to tray" description="Close button minimizes to system tray instead of quitting">
              <button
                onClick={() => updateSetting('minimizeToTray', !settings.minimizeToTray)}
                className={`toggle-track ${settings.minimizeToTray ? 'active' : ''}`}
              >
                <div className="toggle-knob" />
              </button>
            </SettingRow>
            <SettingRow label="Reminder" description="Minutes before due time to show notification">
              <select
                value={settings.reminderMinutesBefore}
                onChange={(e) => updateSetting('reminderMinutesBefore', parseInt(e.target.value))}
                className="surface-elevated border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none"
              >
                <option value="5">5 mins</option>
                <option value="10">10 mins</option>
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="60">1 hour</option>
              </select>
            </SettingRow>
          </Section>

          {/* Categories */}
          <Section title="Categories">
            <div className="surface rounded-lg p-3.5 border border-white/[0.03]">
              <div className="space-y-1 mb-3">
                {settings.categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-white/[0.03] group">
                    <span className="text-[13px] text-zinc-300">{cat}</span>
                    <button
                      onClick={() => removeCategory(cat)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  placeholder="New category..."
                  className="flex-1 surface-elevated border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500/40"
                />
                <button
                  onClick={addCategory}
                  className="px-3 py-1.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[12px] hover:bg-indigo-500/25"
                >
                  Add
                </button>
              </div>
            </div>
          </Section>

          {/* Data */}
          <Section title="Data">
            <SettingRow label="Database" description="All data stored locally alongside the app">
              <button
                onClick={async () => {
                  const path = await window.taskforge?.app?.getDataPath?.();
                  if (path) alert(`Database location: ${path}`);
                }}
                className="px-3 py-1.5 rounded-md surface-elevated border border-white/[0.06] text-zinc-400 text-[12px] hover:bg-white/5"
              >
                Show location
              </button>
            </SettingRow>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg surface-elevated border border-white/[0.06] text-zinc-400 text-[12px] hover:bg-white/5 transition-colors">
                Export JSON
              </button>
              <button className="flex-1 py-2 rounded-lg surface-elevated border border-white/[0.06] text-zinc-400 text-[12px] hover:bg-white/5 transition-colors">
                Export CSV
              </button>
              <button className="flex-1 py-2 rounded-lg surface-elevated border border-white/[0.06] text-zinc-400 text-[12px] hover:bg-white/5 transition-colors">
                Import JSON
              </button>
            </div>
          </Section>

          {/* About */}
          <Section title="About">
            <div className="surface rounded-lg p-3.5 border border-white/[0.03]">
              <div className="text-[15px] font-medium text-zinc-200 mb-1">
                <span className="text-indigo-400">Task</span>Forge
              </div>
              <div className="text-[12px] text-zinc-500 leading-relaxed">
                Version 1.0.0<br />
                Built with Electron + React + SQLite<br />
                100% local — your data never leaves your machine
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-[11px] text-zinc-600 font-medium mb-1.5">Keyboard shortcuts</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {[
                    ['Ctrl+N', 'Quick add task'],
                    ['Ctrl+Z', 'Undo last action'],
                    ['Ctrl+1-5', 'Switch views'],
                    ['1-4', 'Set priority'],
                    ['Escape', 'Close dialog'],
                    ['Ctrl+Enter', 'Save task form'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2">
                      <kbd className="bg-white/5 text-zinc-500 px-1.5 py-px rounded text-[10px] font-mono">{key}</kbd>
                      <span className="text-zinc-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
