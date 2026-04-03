
"use client";

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';

export default function ScrollToTopButton() {
  const { view, isUiVisible } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    const firstSection = document.getElementById('section-1');
    if (firstSection) {
      if (window.scrollY > firstSection.offsetTop) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else {
        // Fallback for introduction view
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  if (view !== 'sutra' && view !== 'introduction') {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <Button
        size="icon"
        onClick={scrollToTop}
        className={`h-9 w-9 transition-opacity duration-300 ${
          isVisible && isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        variant="outline"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}

    