
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type View = 'introduction' | 'sutra' | 'index' | 'glossary';
export type Language = 'sanskrit-devanagari' | 'tibetan' | 'tibetan-translit' | 'english';
export type Theme = 'light' | 'dark' | 'sepia';

interface AppContextType {
  view: View;
  setView: (view: View) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  textSize: number;
  setTextSize: (size: number | ((s: number) => number)) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number | ((s: number) => number)) => void;
  isScrolling: boolean;
  setIsScrolling: (scrolling: boolean | ((s: boolean) => boolean)) => void;
  isDonationModalOpen: boolean;
  setIsDonationModalOpen: (open: boolean) => void;
  highlightedTerm: string | null;
  setHighlightedTerm: (term: string | null) => void;
  isUiVisible: boolean;
  setIsUiVisible: (visible: boolean | ((v: boolean) => boolean)) => void;
  theme: Theme;
  setTheme: (theme: Theme | ((t: Theme) => Theme)) => void;
  manualScroll: boolean;
  setManualScroll: (manual: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('sutra');
  const [language, setLanguage] = useState<Language>('english');
  const [textSize, setTextSize] = useState<number>(1.25); // 1.25rem is the new 100%
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.1);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [highlightedTerm, setHighlightedTerm] = useState<string | null>(null);
  const [isUiVisible, setIsUiVisible] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [manualScroll, setManualScroll] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDonationModalOpen(true);
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearTimeout(timer);
  }, []);
  
  const value = {
    view,
    setView,
    language,
    setLanguage,
    textSize,
    setTextSize,
    scrollSpeed,
    setScrollSpeed,
    isScrolling,
    setIsScrolling,
    isDonationModalOpen,
    setIsDonationModalOpen,
    highlightedTerm,
    setHighlightedTerm,
    isUiVisible,
    setIsUiVisible,
    theme,
    setTheme,
    manualScroll,
    setManualScroll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

    