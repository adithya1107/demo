
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('colcord-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Default to dark mode as per design system
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Update CSS variables based on theme
    if (theme === 'light') {
      // Light mode overrides
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 0%');
      root.style.setProperty('--card', '0 0% 0% / 0.05');
      root.style.setProperty('--card-foreground', '0 0% 0%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 0%');
      root.style.setProperty('--primary', '0 0% 0%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 0% / 0.1');
      root.style.setProperty('--secondary-foreground', '0 0% 0%');
      root.style.setProperty('--muted', '0 0% 0% / 0.05');
      root.style.setProperty('--muted-foreground', '0 0% 0% / 0.6');
      root.style.setProperty('--accent', '0 0% 0% / 0.1');
      root.style.setProperty('--accent-foreground', '0 0% 0%');
      root.style.setProperty('--border', '0 0% 0% / 0.1');
      root.style.setProperty('--input', '0 0% 0% / 0.05');
      root.style.setProperty('--ring', '0 0% 0% / 0.4');
      root.style.setProperty('--sidebar-background', '0 0% 100%');
      root.style.setProperty('--sidebar-foreground', '0 0% 0% / 0.6');
      root.style.setProperty('--sidebar-primary', '0 0% 0%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-accent', '0 0% 0% / 0.05');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 0%');
      root.style.setProperty('--sidebar-border', '0 0% 0% / 0.1');
      root.style.setProperty('--sidebar-ring', '0 0% 0% / 0.4');
    } else {
      // Dark mode (default from CSS)
      root.style.setProperty('--background', '0 0% 0%');
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--card', '0 0% 100% / 0.05');
      root.style.setProperty('--card-foreground', '0 0% 100%');
      root.style.setProperty('--popover', '0 0% 0%');
      root.style.setProperty('--popover-foreground', '0 0% 100%');
      root.style.setProperty('--primary', '0 0% 100%');
      root.style.setProperty('--primary-foreground', '0 0% 0%');
      root.style.setProperty('--secondary', '0 0% 100% / 0.1');
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
      root.style.setProperty('--muted', '0 0% 100% / 0.05');
      root.style.setProperty('--muted-foreground', '0 0% 100% / 0.6');
      root.style.setProperty('--accent', '0 0% 100% / 0.1');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 100% / 0.1');
      root.style.setProperty('--input', '0 0% 100% / 0.05');
      root.style.setProperty('--ring', '0 0% 100% / 0.4');
      root.style.setProperty('--sidebar-background', '0 0% 0%');
      root.style.setProperty('--sidebar-foreground', '0 0% 100% / 0.6');
      root.style.setProperty('--sidebar-primary', '0 0% 100%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 0%');
      root.style.setProperty('--sidebar-accent', '0 0% 100% / 0.05');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-border', '0 0% 100% / 0.1');
      root.style.setProperty('--sidebar-ring', '0 0% 100% / 0.4');
    }
    
    // Save to localStorage
    localStorage.setItem('colcord-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
