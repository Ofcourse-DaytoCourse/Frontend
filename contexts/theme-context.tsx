"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "pink" | "blue";

interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  gradientFrom: string;
  gradientTo: string;
  bgGradient: string;
  accent: string;
}

export const themes: Record<ThemeType, ThemeConfig> = {
  pink: {
    name: "핑크 테마",
    primary: "from-pink-500 to-rose-500",
    secondary: "from-pink-50 to-rose-50", 
    gradientFrom: "from-pink-600",
    gradientTo: "to-rose-600",
    bgGradient: "from-pink-50 via-white to-rose-50",
    accent: "pink-500"
  },
  blue: {
    name: "하늘 테마",
    primary: "from-sky-400 to-cyan-400",
    secondary: "from-sky-50 to-cyan-50",
    gradientFrom: "from-sky-500", 
    gradientTo: "to-cyan-500",
    bgGradient: "from-sky-50 via-white to-cyan-50",
    accent: "sky-400"
  }
};

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>("pink");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  return (
    <ThemeContext.Provider 
      value={{
        currentTheme,
        setTheme,
        themeConfig: themes[currentTheme]
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}