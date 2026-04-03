
"use client";

import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Play, Pause, ZoomIn, ZoomOut, Fullscreen, Minimize, TimerIcon, Move3d } from "lucide-react";
import ThemeSwitcher from "@/components/theme-switcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  const {
    textSize,
    setTextSize,
    scrollSpeed,
    setScrollSpeed,
    isScrolling,
    setIsScrolling,
    isTiltScrolling,
    setIsTiltScrolling,
    view,
    isUiVisible,
    setIsUiVisible,
    setPermissionGranted,
    permissionGranted
  } = useAppContext();
  const isMobile = useIsMobile();

  const handleTextSize = (amount: number) => {
    setTextSize(s => Math.max(0.5, Math.min(s + amount, 2.5)));
  };

  const handleScrollSpeed = (amount: number) => {
    setScrollSpeed(s => Math.max(0.1, Math.min(s + amount, 5)));
  };

  const requestTiltPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setIsTiltScrolling(true);
        } else {
          alert('Permission to access device orientation was denied.');
          setIsTiltScrolling(false);
          setPermissionGranted(false);
        }
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        setIsTiltScrolling(false);
        setPermissionGranted(false);
      }
    } else {
      // For devices that don't require permission
      setPermissionGranted(true);
      setIsTiltScrolling(true);
    }
  };

  const toggleTiltScroll = () => {
      if (isTiltScrolling) {
          setIsTiltScrolling(false);
      } else {
          if (permissionGranted) {
              setIsTiltScrolling(true);
          } else {
              requestTiltPermission();
          }
      }
      if (isScrolling) {
          setIsScrolling(false);
      }
  };


  const toggleAutoScroll = () => {
    setIsScrolling(s => !s);
    if(isTiltScrolling) {
      setIsTiltScrolling(false);
    }
  }

  if (view !== 'sutra') {
    return null;
  }
  
  const controlStyles = "flex items-center gap-1 p-1 bg-background/80 backdrop-blur-lg rounded-md border"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="relative max-w-lg mx-auto h-12 flex items-center justify-between">
            <div className={cn(controlStyles, "transition-opacity duration-300", !isUiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
                <Button variant="ghost" size="icon" onClick={() => handleScrollSpeed(-0.2)} aria-label="Decrease scroll speed" className="h-9 w-9">
                    <Minus className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleAutoScroll} aria-label={isScrolling ? 'Pause scrolling' : 'Play scrolling'} className={cn("h-9 w-9", isScrolling && "text-primary bg-primary/10")}>
                    {isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleScrollSpeed(0.2)} aria-label="Increase scroll speed" className="h-9 w-9">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            
            <div className={cn(controlStyles, "absolute left-1/2 -translate-x-1/2")}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setIsUiVisible((v) => !v)}
                    aria-label="Toggle UI visibility"
                >
                    {isUiVisible ? <Fullscreen className="h-5 w-5" /> : <Minimize className="h-5 w-5" />}
                </Button>
                 <Button variant="ghost" size="icon" onClick={toggleTiltScroll} aria-label="Toggle tilt scroll" className={cn("h-9 w-9", isTiltScrolling && "text-primary bg-primary/10")}>
                    <Move3d className="h-5 w-5" />
                </Button>
                <ThemeSwitcher />
            </div>

            <div className={cn(controlStyles, "transition-opacity duration-300", !isUiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
                 <Button variant="ghost" size="icon" onClick={() => handleTextSize(-0.1)} aria-label="Decrease text size" className="h-9 w-9">
                    <ZoomOut className="h-5 w-5" />
                </Button>
                {!isMobile && <span className="w-10 text-center font-sans text-sm tabular-nums">{((textSize / 1.25) * 100).toFixed(0)}%</span>}
                <Button variant="ghost" size="icon" onClick={() => handleTextSize(0.1)} aria-label="Increase text size" className="h-9 w-9">
                    <ZoomIn className="h-5 w-5" />
                </Button>
            </div>
        </div>
        <div className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-background/80 backdrop-blur-lg rounded-md border transition-opacity duration-300",
            (isScrolling || isTiltScrolling) && isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
           <Timer />
        </div>
    </div>
  );
}

    

    