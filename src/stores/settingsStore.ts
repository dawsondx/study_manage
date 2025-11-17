import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, Theme } from '../types';

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  getTheme: () => Theme;
  isDarkMode: () => boolean;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  notifications: true,
  autoBackup: true,
  backupInterval: 24, // 24小时
  defaultCurrency: 'CNY',
  language: 'zh-CN',
  createdAt: new Date(),
  updatedAt: new Date()
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { 
            ...state.settings, 
            ...newSettings, 
            updatedAt: new Date() 
          }
        }));
      },

      toggleTheme: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
            updatedAt: new Date()
          }
        }));
      },

      toggleNotifications: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: !state.settings.notifications,
            updatedAt: new Date()
          }
        }));
      },

      getTheme: () => {
        return get().settings.theme;
      },

      isDarkMode: () => {
        return get().settings.theme === 'dark';
      }
    }),
    {
      name: 'settings-store',
      skipHydration: true
    }
  )
);