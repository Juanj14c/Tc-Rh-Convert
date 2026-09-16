"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ThemeContext,
  type ThemeContextValue,
} from "./themeContext";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  const resetTheme = () => {
    setIsDarkMode(false);
  };

  const value: ThemeContextValue = {
    isDarkMode,
    toggleTheme,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}