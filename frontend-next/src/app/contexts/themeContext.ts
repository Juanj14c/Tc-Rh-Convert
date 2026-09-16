import { createContext } from "react";

export interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
  resetTheme: () => void;
}

export const ThemeContext =
  createContext<ThemeContextValue | undefined>(undefined);