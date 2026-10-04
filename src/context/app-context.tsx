
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

export type View = 'introduction' | 'sutra' | 'index' | 'glossary';
export type Language = 'sanskrit' | 'tibetan' | 'english';
export type TibetanScript = 'tibetan' | 'tibetan-translit';
export type SanskritScript = 'sanskrit-devanagari' | 'sanskrit-translit';
export type Theme = 'light' | 'dark';
export type ReadingMode = 'scroll' | 'pages';
export type ReaderPosition = { section: number; page: number; count: number; sections: number };
export type ReaderNavigation = { id: number; kind: 'turn' | 'start' | 'section'; value: number };

interface AppContextType {
  view: View;
  setView: (view: View) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  tibetanScript: TibetanScript;
  setTibetanScript: (script: TibetanScript) => void;
  sanskritScript: SanskritScript;
  setSanskritScript: (script: SanskritScript) => void;
  textSize: number;
  setTextSize: (size: number | ((s: number) => number)) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number | ((s: number) => number)) => void;
  isScrolling: boolean;
  setIsScrolling: (scrolling: boolean | ((s: boolean) => boolean)) => void;
  isTiltScrolling: boolean;
  setIsTiltScrolling: (scrolling: boolean | ((s: boolean) => boolean)) => void;
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
  readingStartTime: number | null;
  setReadingStartTime: (time: number | null) => void;
  permissionGranted: boolean;
  setPermissionGranted: (granted: boolean) => void;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  readerPosition: ReaderPosition;
  setReaderPosition: React.Dispatch<React.SetStateAction<ReaderPosition>>;
  readerNavigation: ReaderNavigation | null;
  navigateReader: (kind: ReaderNavigation['kind'], value?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('sutra');
  const [language, setLanguage] = useState<Language>('english');
  const [tibetanScript, setTibetanScript] = useState<TibetanScript>('tibetan');
  const [sanskritScript, setSanskritScript] = useState<SanskritScript>('sanskrit-devanagari');
  const [textSize, setTextSize] = useState<number>(1.25);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.1);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [isTiltScrolling, setIsTiltScrolling] = useState<boolean>(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [highlightedTerm, setHighlightedTerm] = useState<string | null>(null);
  const [isUiVisible, setIsUiVisible] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [manualScroll, setManualScroll] = useState<boolean>(false);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [readerPosition, setReaderPosition] = useState<ReaderPosition>({section:0, page:0, count:1, sections:1});
  const [readerNavigation, setReaderNavigation] = useState<ReaderNavigation | null>(null);
  const navigateReader = useCallback((kind: ReaderNavigation['kind'], value = 0) => {
    setReaderNavigation(previous => ({id:(previous?.id || 0) + 1, kind, value}));
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('vcs-reading-mode') === 'pages') setReadingMode('pages');
    } catch { /* Reading also works when browser storage is unavailable. */ }
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    try { localStorage.setItem('vcs-reading-mode', readingMode); } catch {}
    if (readingMode === 'pages') {
      setIsScrolling(false);
      setIsTiltScrolling(false);
    }
  }, [readingMode, preferencesLoaded]);

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setIsUiVisible(true);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDonationModalOpen(true);
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isScrolling || isTiltScrolling) {
        if (!readingStartTime) {
            setReadingStartTime(Date.now());
        }
    } else {
        setReadingStartTime(null);
    }
  }, [isScrolling, isTiltScrolling, readingStartTime]);

  const value = {
    view,
    setView,
    language,
    setLanguage,
    tibetanScript,
    setTibetanScript,
    sanskritScript,
    setSanskritScript,
    textSize,
    setTextSize,
    scrollSpeed,
    setScrollSpeed,
    isScrolling,
    setIsScrolling,
    isTiltScrolling,
    setIsTiltScrolling,
    isDonationModalOpen,
    setIsDonationModalOpen,
    highlightedTerm,
    setHighlightedTerm,
    isUiVisible,
    setIsUiVisible,
    theme,
    setTheme,
    manualScroll,
    setManualScroll,
    readingStartTime,
    setReadingStartTime,
    permissionGranted,
    setPermissionGranted,
    readingMode,
    setReadingMode,
    readerPosition,
    setReaderPosition,
    readerNavigation,
    navigateReader
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


