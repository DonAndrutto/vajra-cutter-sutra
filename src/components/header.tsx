
"use client";

import { useAppContext, View } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/language-selector";
import InstallAppButton from "@/components/install-app-button";
import { BookMarked, BookOpen, List, Info, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

const NavButton = ({
  targetView,
  label,
  icon: Icon,
}: {
  targetView: View;
  label: string;
  icon: React.ElementType;
}) => {
  const { view, setView } = useAppContext();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }
  
  const showText = !isMobile;

  return (
    <Button
      variant="ghost"
      size={isMobile ? "icon" : "sm"}
      onClick={() => setView(targetView)}
      className={`font-sans transition-all duration-200 h-9 shrink-0 ${
        isMobile ? "w-9" : "px-3"
      } ${
        view === targetView ? "bg-primary/10 text-primary" : ""
      }`}
      aria-label={label}
    >
      <Icon className={`h-4 w-4 ${showText ? 'mr-2' : ''}`} />
      {showText && <span>{label}</span>}
    </Button>
  );
};

export default function Header({ isVisible }: { isVisible: boolean }) {
  const { setIsDonationModalOpen } = useAppContext();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }
  
  return (
    <header className={`sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-2 sm:px-4">
        <nav className="flex items-center space-x-0">
          <NavButton targetView="introduction" label="Introduction" icon={Info} />
          <NavButton targetView="sutra" label="Sutra" icon={BookOpen} />
          <NavButton targetView="index" label="Index" icon={List} />
          <NavButton targetView="glossary" label="Glossary" icon={BookMarked} />
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-1">
            <LanguageSelector />
            <InstallAppButton />
            {!isMobile && (
              <Button
                  variant="outline"
                  size="sm"
                  className="font-sans border-primary text-primary hover:bg-primary hover:text-primary-foreground h-9"
                  onClick={() => setIsDonationModalOpen(true)}
              >
                  <Heart className="h-4 w-4 mr-2"/>
                  <span>Donate</span>
              </Button>
            )}
        </div>
      </div>
    </header>
  );
}

    