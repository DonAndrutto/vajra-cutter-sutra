
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAppContext, View } from '@/context/app-context';
import Header from '@/components/header';
import DonationModal from '@/components/donation-modal';
import ScrollToTopButton from '@/components/scroll-to-top';
import BottomBar from '@/components/bottom-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sutraData } from '@/data/sutra-data';
import { glossaryData, GlossaryTerm } from '@/data/glossary-data';
import { Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const IntroductionView = () => {
  const { setView, setIsDonationModalOpen } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <h2 className="font-headline text-3xl md:text-4xl text-center text-primary">Introduction to the Vajracchedikā Sūtra</h2>
      <p className="text-lg leading-relaxed text-justify font-bold">
          Understanding the Diamond Cutter Sutra.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        Welcome. You may know this text as the “Diamond Sutra,” but its original title, Vajracchedikā Prajñāpāramitā Sūtra, reveals a more profound significance. This is The Perfection of Wisdom that Cuts Through Vajra (otherwise considered indestructible) - an insight so sharp it cuts through even the most solid concepts of reality, self, and awakening, leaving the mind spacious and free of all notions or views.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        This app is designed to support your practice. Compare translations side-by-side in Sanskrit, Tibetan, and English. Use the auto-scroll for recitation, adjust the text size for comfort, and explore the glossary for key terms.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        The sutra works through paradox. It uses language to dismantle the traps of language itself. As the Buddha taught, his teaching is like a raft: essential for crossing the river, but left behind once you reach the other shore. This wisdom points to a truth that is ineffable, yet directly experienceable.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        For this reason, recitation is a core practice. Its very sound is said to purify the mind, even without full understanding. The oldest known, dated printed book in the world is a copy of this very sutra from 868 CE, but the wisdom contained within it still remains fresh.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        Do not be discouraged if, at first, the sutra seems paradoxical or impenetrable. That is its nature. It is a fire meant to burn away all concepts, including the concept of "fire" itself.
      </p>
      <p className="text-lg leading-relaxed text-justify">
        It is a custom for practitioners to recite it daily. Read it. Recite it. Let the questions echo in your mind. Do not struggle to "figure it out." Allow it to work on you.
      </p>
       <p className="text-lg leading-relaxed text-justify">
        Let the cutting begin.
      </p>
      <div className="text-center pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" onClick={() => setView('sutra')}>Explore the Sutra</Button>
      </div>
    </div>
  );
}

const SutraView = () => {
    const { 
      textSize, 
      isScrolling, 
      scrollSpeed, 
      language,
      tibetanScript,
      sanskritScript,
      highlightedTerm,
      manualScroll,
      setManualScroll,
      isTiltScrolling,
      setReadingStartTime,
      permissionGranted,
      setIsScrolling
    } = useAppContext();
    const scrollIntervalRef = useRef<number | null>(null);

    const activeLanguage = useMemo(() => {
        if (language === 'tibetan') return tibetanScript;
        if (language === 'sanskrit') return sanskritScript;
        return language;
    }, [language, tibetanScript, sanskritScript]);

    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    const startScrolling = useCallback(() => {
      stopScrolling();
      if(setReadingStartTime) setReadingStartTime(Date.now());

      scrollIntervalRef.current = window.setInterval(() => {
          if (manualScroll) return;

          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          const currentScroll = window.scrollY;

          // Stop if we are near the bottom of the page
          if (currentScroll + clientHeight >= scrollHeight - 2) {
              stopScrolling();
              if (setIsScrolling) setIsScrolling(false); // Stop the scrolling state
              return;
          }

          // Use a more sensitive scroll amount for better regulation
          const scrollAmount = Math.max(0.2, scrollSpeed * 0.5);
          window.scrollBy({ top: scrollAmount, behavior: 'auto' });
      }, 16);
    }, [stopScrolling, manualScroll, setReadingStartTime, scrollSpeed, setIsScrolling]);
  
    useEffect(() => {
        if (isScrolling) {
            startScrolling();
        } else {
            stopScrolling();
        }
        return stopScrolling;
    }, [isScrolling, startScrolling, stopScrolling]);

    useEffect(() => {
      let animationFrameId: number | null = null;
      let referenceBeta: number | null = null;
    
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.beta === null) return;
    
        if (referenceBeta === null) {
          referenceBeta = event.beta;
        }
    
        const tilt = event.beta - referenceBeta;
        // Invert the scroll direction and use a non-linear curve
        const scrollAmount = Math.pow(Math.abs(tilt) / 10, 2) * -Math.sign(tilt) * scrollSpeed;
    
        const scroll = () => {
          if (isTiltScrolling && Math.abs(tilt) > 1) { // Tilt threshold
            window.scrollBy({ top: scrollAmount, behavior: 'auto' });
            animationFrameId = requestAnimationFrame(scroll);
          } else {
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
          }
        };
        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        scroll();
      };
    
      const start = () => {
        if (isTiltScrolling && permissionGranted) {
          if(setReadingStartTime) setReadingStartTime(Date.now());
          window.addEventListener('deviceorientation', handleOrientation);
        }
      };
    
      const stop = () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        referenceBeta = null;
      };
    
      if (isTiltScrolling && permissionGranted) {
        start();
      } else {
        stop();
      }
    
      return stop;
    }, [isTiltScrolling, permissionGranted, scrollSpeed, setReadingStartTime]);


    useEffect(() => {
      const handleWheel = () => {
          if (isScrolling) {
              stopScrolling();
          }
          setManualScroll(true);
          setTimeout(() => setManualScroll(false), 2000);
      };
      
      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('touchmove', handleWheel, { passive: true });
      
      return () => {
          window.removeEventListener('wheel', handleWheel);
          window.removeEventListener('touchmove', handleWheel);
      };
  }, [setManualScroll, isScrolling, stopScrolling]);
  
    const titleSection = sutraData.find(s => s.section === 0);
    const sutraSections = sutraData.filter(s => s.section > 0);
  
    const renderText = (text: string) => {
      if (!highlightedTerm) {
        return text;
      }
      const termRegex = new RegExp(`(${highlightedTerm})`, 'gi');
      return text.split(termRegex).map((part, i) =>
        part.match(termRegex) ? <span key={i} className="bg-primary/20">{part}</span> : part
      );
    };
    
    const getFontClass = () => {
      switch (activeLanguage) {
        case 'tibetan':
          return 'font-tibetan';
        default:
          return 'font-body';
      }
    };
    
    const currentTextSize = useMemo(() => {
        if (activeLanguage === 'english') {
            return textSize * 0.9;
        }
        if (activeLanguage === 'tibetan-translit') {
          return textSize * 0.8;
        }
        return textSize;
      }, [activeLanguage, textSize]);
  
    return (
      <div 
        style={{ fontSize: `${currentTextSize}rem` }} 
        className={`transition-all duration-300 relative ${getFontClass()}`}
      >
        <h2 className="font-headline text-3xl md:text-4xl text-center text-primary mb-4 pt-12">{titleSection?.title[activeLanguage] || titleSection?.title['english']}</h2>
        {titleSection?.content[activeLanguage]?.map((paragraph, index) => (
          <p key={index} className="text-center text-muted-foreground italic mb-8">{paragraph}</p>
        ))}
  
        <div className="space-y-8 mt-8">
          {sutraSections.map(item => (
            <div key={item.section} id={`section-${item.section}`} className="sutra-section scroll-mt-24">
              <h3 className="font-headline text-xl font-semibold text-primary/80 mb-4 border-b pb-2">
                Section {item.section}{item.title['english'] && `: ${item.title['english']}`}
              </h3>
              {item.content[activeLanguage]?.map((paragraph, index) => (
                <p key={index} className={cn("text-justify my-4", (activeLanguage === 'english' || activeLanguage === 'tibetan-translit') ? 'leading-relaxed' : 'leading-loose')}>
                  {renderText(paragraph)}
                </p>
              ))}
            </div>
          ))}
        </div>
        
        <footer className="mt-16 py-8 text-center">
          <p className="text-xs text-muted-foreground/50 font-sans">
            Copyright: Andrzej R. Rybszleger 2025
          </p>
          <p className="text-xs text-muted-foreground/50 font-sans">
            rybszlegerr@gmail.com
          </p>
        </footer>
      </div>
    );
  };


const IndexView = () => {
    const { setView, setManualScroll } = useAppContext();
    const sections = sutraData.filter(s => s.section > 0);
  
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, section: number) => {
      e.preventDefault();
      setView('sutra');
      setManualScroll(true); // Pause auto-scrolling
      
      setTimeout(() => {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
          window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
          });
        }
      }, 100);

      setTimeout(() => setManualScroll(false), 2000); // Resume auto-scrolling after a delay
    };
  
  
    return (
        <Card className="h-full overflow-y-auto bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
            <ul className="divide-y">
              {sections.map(item => (
                <li key={item.section}>
                  <a href={`#section-${item.section}`} 
                     onClick={(e) => handleLinkClick(e, item.section)}
                     className="block p-4 hover:bg-accent transition-colors duration-200 font-sans">
                    Section {item.section}{item.title['english'] && `: ${item.title['english']}`}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
    );
  };
  
const GlossaryView = () => {
    const { setHighlightedTerm, language, tibetanScript, sanskritScript } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const activeLanguage = useMemo(() => {
        if (language === 'tibetan') return tibetanScript;
        if (language === 'sanskrit') return sanskritScript;
        return language;
    }, [language, tibetanScript, sanskritScript]);


    const sortedGlossary = useMemo(() => {
        let data = [...glossaryData];
        if (language === 'tibetan') {
            const tibetanAlphabet = "ཀཁགངཅཆཇཉཏཐདནཔཕབམཙཚཛཝཞཟའཡརལཤསཧཨ";
            data = data.filter(item => item.tibetan).sort((a, b) => {
                const termA = a.tibetan!.replace(/[།\s()]/g, '');
                const termB = b.tibetan!.replace(/[།\s()]/g, '');
                const indexA = tibetanAlphabet.indexOf(termA.charAt(0));
                const indexB = tibetanAlphabet.indexOf(termB.charAt(0));

                if (indexA === -1 && indexB === -1) return termA.localeCompare(termB);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                if (indexA !== indexB) return indexA - indexB;
                return termA.localeCompare(termB);
            });
        } else if (language === 'sanskrit') {
            data = data.filter(item => item.sanskrit).sort((a, b) => {
                return a.sanskrit!.localeCompare(b.sanskrit!, 'sa-IN-u-co-trad');
            });
        } else { // english
            data.sort((a, b) => a.term.localeCompare(b.term));
        }
        return data;
    }, [language]);

    const filteredGlossary = useMemo(() => {
        if (!searchTerm) return sortedGlossary;
        return sortedGlossary.filter(item =>
            item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sanskrit && item.sanskrit.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.tibetan && item.tibetan.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, sortedGlossary]);
  
    const handleTermClick = (term: string) => {
      setHighlightedTerm(term);
    };
    
    const getTriggerText = (item: GlossaryTerm) => {
        if (language === 'tibetan') return item.tibetan || item.term;
        if (language === 'sanskrit') return item.sanskrit || item.term;
        return item.term;
    }
  
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="p-4">
          <Input
            type="text"
            placeholder="Search glossary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-sans"
          />
        </div>
        <div className="flex-grow overflow-y-auto">
          <Accordion type="single" collapsible className="w-full">
            {filteredGlossary.map((item) => (
              <AccordionItem value={item.term} key={item.term}>
                <AccordionTrigger 
                  className={`font-sans text-xl text-left hover:no-underline px-4 ${language === 'tibetan' ? 'font-tibetan' : ''}`}
                  onClick={() => handleTermClick(item.term)}
                >
                  {getTriggerText(item)}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 font-sans px-4">
                  {language !== 'english' && <p className="font-bold text-primary text-base">{item.term}</p>}
                  <p className="text-base">{item.definition}</p>
                  <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-muted-foreground pt-2">
                    {item.sanskrit && <span className="font-mono text-xs text-[80%]">{item.sanskrit}</span>}
                    {item.tibetan && <span className="font-tibetan text-base">{item.tibetan}</span>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    );
  };

const MainContent = ({ view }: { view: View }) => {
  let mainView = view;
  if (view === 'index' || view === 'glossary') {
    mainView = 'sutra';
  }

  return (
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {mainView === 'introduction' && <IntroductionView />}
          {mainView === 'sutra' && <SutraView />}
      </main>
  )
}

export default function Home() {
  const { view, setView, isUiVisible } = useAppContext();
  const [scrollTop, setScrollTop] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isSheetOpen = view === 'index' || view === 'glossary';

  const handleSheetChange = (open: boolean) => {
    if (!open) {
        setView('sutra');
    }
  }

  if (!mounted) {
    return null; 
  }

  return (
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-500 pb-20">
        <div 
          className={cn(
            "h-[150px] flex items-center justify-center text-center relative transition-opacity duration-300",
            !isUiVisible && 'opacity-0',
            isSheetOpen && 'opacity-0'
          )}
          style={{ opacity: isSheetOpen ? 0 : Math.max(0, 1 - scrollTop / 100) }}
        >
          <h1 className="font-headline text-[clamp(2.5rem,8vw,4.5rem)] font-bold text-primary tracking-tight">
            Vajra-Cutter Sutra Reader
          </h1>
        </div>
        <Header isVisible={isUiVisible && !isSheetOpen} />
        
        <div className={`transition-all duration-500 ${isSheetOpen ? 'blur-sm brightness-50' : ''}`}>
          <MainContent view={view} />
        </div>
        
        <Sheet open={isSheetOpen} onOpenChange={handleSheetChange}>
            <SheetContent className="sm:max-w-md w-full flex flex-col p-0 bg-background/95 backdrop-blur-xl border-l">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="font-sans capitalize">{view}</SheetTitle>
                </SheetHeader>
                {view === 'index' && <IndexView />}
                {view === 'glossary' && <GlossaryView />}
            </SheetContent>
        </Sheet>
        
        <ScrollToTopButton />
        <BottomBar />
        <DonationModal />
      </div>
  );
}

    
    