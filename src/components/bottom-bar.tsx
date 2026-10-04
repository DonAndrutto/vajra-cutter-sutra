"use client";

import { useAppContext } from "@/context/app-context";
import { TimerIcon } from "lucide-react";
import ThemeSwitcher from "@/components/theme-switcher";
import ReaderIcon from "@/components/reader-icon";
import { useState, useEffect } from "react";

const Timer = () => {
    const { isScrolling, readingStartTime, scrollSpeed, isTiltScrolling } = useAppContext();
    const [displayMode, setDisplayMode] = useState<'remaining' | 'elapsed'>('remaining');
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        if (!isScrolling && !isTiltScrolling) return;
        
        const timerInterval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        const scrollListener = () => {
            setScrollPosition(window.scrollY);
        };
        window.addEventListener('scroll', scrollListener, { passive: true });
        scrollListener(); // Initial check

        return () => {
            clearInterval(timerInterval);
            window.removeEventListener('scroll', scrollListener);
        };
    }, [isScrolling, isTiltScrolling]);

    if ((!isScrolling && !isTiltScrolling) || readingStartTime === null) {
        return null;
    }

    const formatTime = (totalSeconds: number) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const elapsedTime = (currentTime - readingStartTime) / 1000;

    const calculateRemainingTime = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const maxScrollTop = scrollHeight - clientHeight;
        
        if (maxScrollTop <= 0) return 0;
        
        const pixelsPerSecond = 20 * scrollSpeed;
        
        if (pixelsPerSecond <= 0) return Infinity;

        return (maxScrollTop - scrollPosition) / pixelsPerSecond;
    };

    const remainingTime = calculateRemainingTime();
    const displayedTime = displayMode === 'remaining' ? remainingTime : elapsedTime;
    const label = displayMode === 'remaining' ? 'Remaining' : 'Elapsed';

    return (
        <div 
            className="flex items-center gap-2 text-xs font-sans tabular-nums cursor-pointer"
            onClick={() => setDisplayMode(m => m === 'remaining' ? 'elapsed' : 'remaining')}
        >
            <TimerIcon className="h-4 w-4"/>
            <span>{label}: {formatTime(displayedTime)}</span>
        </div>
    );
};


export default function BottomBar() {
  const {setTextSize, setScrollSpeed, isScrolling, setIsScrolling, isTiltScrolling,
    setIsTiltScrolling, view, isUiVisible, setIsUiVisible, setPermissionGranted,
    permissionGranted, readingMode, setReadingMode} = useAppContext();
  const paged = readingMode === 'pages';
  const togglePages = () => {
    setIsScrolling(false);
    setIsTiltScrolling(false);
    setReadingMode(paged ? 'scroll' : 'pages');
  };
  const toggleFullscreen = () => {
    setIsUiVisible(!isUiVisible);
    if (isUiVisible) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
  const toggleTilt = async () => {
    if (paged) return;
    setIsScrolling(false);
    if (isTiltScrolling) { setIsTiltScrolling(false); return; }
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    try {
      const granted = permissionGranted || !orientation?.requestPermission || await orientation.requestPermission() === 'granted';
      setPermissionGranted(granted);
      if (!document.documentElement.classList.contains('paged-reading')) setIsTiltScrolling(granted);
    } catch { setPermissionGranted(false); setIsTiltScrolling(false); }
  };
  if (view === 'introduction') return null;
  return <div className="bottom-bar">
    <div className="bar-inner">
      <div className="bar-group reader-toolbar">
        <button type="button" className="bar-btn" id="btnSlower" title="Slower" aria-label="Slower" disabled={paged}
          onClick={() => setScrollSpeed(s => Math.max(0.1, s - 0.2))}><ReaderIcon name="minus" /></button>
        <button type="button" className={`bar-btn ${isScrolling ? 'active' : ''}`} id="btnPlay" title="Play/Pause" aria-label="Play/Pause" aria-pressed={isScrolling} disabled={paged}
          onClick={() => {setIsTiltScrolling(false); setIsScrolling(s => !s);}}><ReaderIcon name={isScrolling ? 'pause' : 'play'} /></button>
        <button type="button" className="bar-btn" id="btnFaster" title="Faster" aria-label="Faster" disabled={paged}
          onClick={() => setScrollSpeed(s => Math.min(5, s + 0.2))}><ReaderIcon name="plus" /></button>
        <button type="button" className={`bar-btn ${paged ? 'active' : ''}`} id="btnPage" title="Page turning mode" aria-label="Page turning mode" aria-pressed={paged}
          onClick={togglePages}><ReaderIcon name="page" /></button>
        <button type="button" className={`bar-btn ${!isUiVisible ? 'active' : ''}`} id="btnFS" title={isUiVisible ? 'Fullscreen' : 'Exit fullscreen'} aria-label={isUiVisible ? 'Fullscreen' : 'Exit fullscreen'} aria-pressed={!isUiVisible}
          onClick={toggleFullscreen}><ReaderIcon name={isUiVisible ? 'fullscreen' : 'contract'} /></button>
        <button type="button" className={`bar-btn ${isTiltScrolling ? 'active' : ''}`} id="btnTilt" title="Tilt scroll" aria-label="Tilt scroll" aria-pressed={isTiltScrolling} disabled={paged}
          onClick={toggleTilt}><ReaderIcon name="tilt" /></button>
        <ThemeSwitcher />
        <button type="button" className="bar-btn" id="btnSmaller" title="Smaller text" aria-label="Smaller text"
          onClick={() => setTextSize(s => Math.max(0.5, s - 0.1))}><ReaderIcon name="smaller" /></button>
        <button type="button" className="bar-btn" id="btnLarger" title="Larger text" aria-label="Larger text"
          onClick={() => setTextSize(s => Math.min(2.5, s + 0.1))}><ReaderIcon name="larger" /></button>
      </div>
    </div>
    {(isScrolling || isTiltScrolling) && isUiVisible && <div className="reader-timer"><Timer /></div>}
  </div>;
}
