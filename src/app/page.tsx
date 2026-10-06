
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
import { usePagedReader } from '@/hooks/use-paged-reader';
import PageNavigation from '@/components/page-navigation';
import { cn } from '@/lib/utils';

const IntroductionView = () => {
  const { setView } = useAppContext();

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
        Select the page icon between + and Fullscreen to turn pages without animation. Swipe left for the next page or right for the previous page. Pinch to decrease the text size by 1 or spread two fingers to increase it by 1, once per gesture in page mode. Use the arrows below the text, tap the left or right edge, or use arrow keys, Page Up/Down, or Space (Shift+Space to go back). Pages keep whole lines and adapt to portrait, landscape, language, and text size. Fullscreen leaves only its expand/contract control; edge taps, swipes, and keyboard page turns still work. In scroll mode, use the text size buttons. The up arrow returns to the beginning of the text.
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
      setIsScrolling,
      readingMode
    } = useAppContext();
    const scrollIntervalRef = useRef<number | null>(null);
    const areaRef = useRef<HTMLDivElement>(null);

    const activeLanguage = useMemo(() => {
        if (language === 'tibetan') return tibetanScript;
        if (language === 'sanskrit') return sanskritScript;
        return language;
    }, [language, tibetanScript, sanskritScript]);

    usePagedReader(areaRef, activeLanguage);

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
        if (isScrolling && readingMode === 'scroll') {
            startScrolling();
        } else {
            stopScrolling();
        }
        return stopScrolling;
    }, [isScrolling, readingMode, startScrolling, stopScrolling]);

    useEffect(() => {
      if (readingMode === 'pages') return;
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
    }, [isTiltScrolling, readingMode, permissionGranted, scrollSpeed, setReadingStartTime]);


    useEffect(() => {
      if (readingMode === 'pages') return;
      let resumeTimer: ReturnType<typeof setTimeout>;
      const handleWheel = () => {
          if (isScrolling) {
              stopScrolling();
          }
          setManualScroll(true);
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => setManualScroll(false), 2000);
      };
      
      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('touchmove', handleWheel, { passive: true });
      
      return () => {
          clearTimeout(resumeTimer);
          window.removeEventListener('wheel', handleWheel);
          window.removeEventListener('touchmove', handleWheel);
      };
  }, [setManualScroll, isScrolling, readingMode, stopScrolling]);
  
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
  
    return <div ref={areaRef} id="contentArea" data-language={activeLanguage}
      style={{fontSize:`min(${currentTextSize}rem, var(--page-font-cap, 1000px))`}}
      className={`content-area ${getFontClass()}`}>
      <section className="section-block" id="section-0" data-section="0">
        <h2 className="sutra-title" data-reading-block="0-title">{titleSection?.title[activeLanguage] || titleSection?.title.english}</h2>
        {titleSection?.content[activeLanguage]?.map((paragraph, index) =>
          <p key={index} className="sutra-title-text" data-reading-block={`0-${index}`}>{paragraph}</p>)}
      </section>
      {sutraSections.map((item, sectionIndex) => <section key={item.section} id={`section-${item.section}`} data-section={item.section} className="section-block">
        <h3 className="section-heading" data-reading-block={`${item.section}-title`}>Section {item.section}{item.title.english && `: ${item.title.english}`}</h3>
        {item.content[activeLanguage]?.map((paragraph, index) => <p key={index} data-reading-block={`${item.section}-${index}`}
          className={`sutra-paragraph ${activeLanguage === 'tibetan' || activeLanguage === 'sanskrit-devanagari' ? 'native-script' : ''}`}>{renderText(paragraph)}</p>)}
        {sectionIndex === sutraSections.length - 1 && <footer className="sutra-footer" data-reading-block="copyright">
          <p>Copyright: Andrzej R. Rybszleger 2025</p><p>rybszlegerr@gmail.com</p>
        </footer>}
      </section>)}
    </div>;
};


const IndexView = () => {
    const {setView, navigateReader, readerPosition, setIsScrolling, setIsTiltScrolling} = useAppContext();
    const sections = sutraData.filter(s => s.section > 0);
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, section: number) => {
      e.preventDefault();
      setIsScrolling(false);
      setIsTiltScrolling(false);
      setView('sutra');
      navigateReader('section', section);
    };
  
  
    return (
        <Card className="h-full overflow-y-auto bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
            <ul className="divide-y">
              {sections.map(item => (
                <li key={item.section}>
                  <a href={`#section-${item.section}`} 
                     onClick={(e) => handleLinkClick(e, item.section)}
                     aria-current={readerPosition.section === item.section ? 'location' : undefined}
                     className={`index-item ${readerPosition.section === item.section ? 'is-current' : ''}`}>
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
      <main className={`reader-main ${mainView === 'introduction' ? 'introduction-main' : ''}`}>
          {mainView === 'introduction' && <IntroductionView />}
          {mainView === 'sutra' && <SutraView />}
      </main>
  )
}

export default function Home() {
  const { view, setView, isUiVisible } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {setMounted(true);}, []);

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
      <div className={`reader-shell ${!isUiVisible ? 'fullscreen' : ''}`}>
        <Header isVisible={isUiVisible} />
        <MainContent view={view} />

        <Sheet open={isSheetOpen} onOpenChange={handleSheetChange}>
            <SheetContent className="sm:max-w-md w-full flex flex-col p-0 bg-background/95 backdrop-blur-xl border-l">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="font-sans capitalize">{view}</SheetTitle>
                </SheetHeader>
                {view === 'index' && <IndexView />}
                {view === 'glossary' && <GlossaryView />}
            </SheetContent>
        </Sheet>
        
        <PageNavigation />
        <ScrollToTopButton />
        <BottomBar />
        <DonationModal />
      </div>
  );
}
