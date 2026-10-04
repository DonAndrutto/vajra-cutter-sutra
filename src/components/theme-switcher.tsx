"use client";

import { useAppContext } from '@/context/app-context';
import ReaderIcon from '@/components/reader-icon';

export default function ThemeSwitcher() {
  const {theme, setTheme} = useAppContext();
  return <button type="button" className="bar-btn" id="btnTheme" title="Toggle theme" aria-label="Toggle theme"
    onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
    <ReaderIcon name={theme === 'light' ? 'sun' : 'moon'} />
  </button>;
}
