// src/stores/themeStore.ts
// Theme management global state
// Following atomic design principle: Zustand Stores handle global state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeKey, DEFAULT_THEME } from '../config/themes';

interface ThemeState {
  currentTheme: ThemeKey;
  isChanging: boolean;
  error: string | null;
}

interface ThemeActions {
  setTheme: (theme: ThemeKey) => void;
  setChanging: (changing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

interface ThemeStore extends ThemeState {
  actions: ThemeActions;
}

const initialState: ThemeState = {
  currentTheme: DEFAULT_THEME,
  isChanging: false,
  error: null,
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      actions: {
        setTheme: (theme: ThemeKey) => {
          set({ currentTheme: theme, error: null });
        },
        
        setChanging: (changing: boolean) => {
          set({ isChanging: changing });
        },
        
        setError: (error: string | null) => {
          set({ error, isChanging: false });
        },
        
        reset: () => {
          set(initialState);
        },
      },
    }),
    {
      name: 'store-updates-theme',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
      }),
    }
  )
);