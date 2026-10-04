"use client";

import { useEffect, useState } from 'react';
import ReaderIcon from '@/components/reader-icon';
import { useAppContext } from '@/context/app-context';

export default function ScrollToTopButton() {
  const {view, isUiVisible, readingMode, readerPosition, navigateReader, setIsScrolling, setIsTiltScrolling} = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 300);
    update();
    window.addEventListener('scroll', update, {passive:true});
    return () => window.removeEventListener('scroll', update);
  }, []);
  const visible = view === 'sutra' && readingMode === 'pages' ? readerPosition.section > 0 || readerPosition.page > 0 : scrolled;
  if (!isUiVisible || !visible || (view !== 'sutra' && view !== 'introduction')) return null;
  return <button type="button" className="scroll-top-btn visible" id="scrollTopBtn" title="Back to top" aria-label="Back to top" onClick={() => {
    setIsScrolling(false);
    setIsTiltScrolling(false);
    if (view === 'sutra') navigateReader('start');
    else window.scrollTo({top:0, behavior:'instant'});
  }}><ReaderIcon name="top" /></button>;
}
