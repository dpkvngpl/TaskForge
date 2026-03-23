import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@shared/constants';
import type { AppSettings } from '@shared/types';

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: unknown) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const raw = await window.taskforge.settings.getAll();
    const merged = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(raw)) {
      try {
        (merged as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    set({ settings: merged as AppSettings, isLoaded: true });
  },

  updateSetting: async (key: string, value: unknown) => {
    await window.taskforge.settings.set(key, JSON.stringify(value));
    set((state) => ({
      settings: { ...state.settings, [key]: value } as AppSettings,
    }));
  },
}));
