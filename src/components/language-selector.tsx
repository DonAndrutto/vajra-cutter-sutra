
"use client";

import { useAppContext, Language, TibetanScript, SanskritScript } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LanguageButton = ({
  targetLang,
  label,
  className,
  children
}: {
  targetLang: Language;
  label?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => {
  const { language, setLanguage, setView } = useAppContext();
  const isActive = language === targetLang;

  const handleClick = () => {
    setLanguage(targetLang);
    setView('sutra');
  };

  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "ghost"}
      onClick={handleClick}
      className={cn("font-sans h-8 px-2 transition-all duration-300", className)}
    >
      {children || label}
    </Button>
  );
};

const ScriptToggleButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: React.ReactNode;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "font-sans h-full px-2 rounded-sm transition-colors duration-200 text-sm cursor-pointer flex items-center justify-center",
        active ? "bg-background/80 text-primary" : "text-primary-foreground/80 hover:bg-background/20"
      )}
    >
      {label}
    </div>
  );
};

export default function LanguageSelector() {
    const { language, tibetanScript, setTibetanScript, sanskritScript, setSanskritScript } = useAppContext();

  const handleScriptClick = (e: React.MouseEvent, scriptSetter: (script: any) => void, script: any) => {
    e.stopPropagation();
    scriptSetter(script);
  }

  return (
    <div className="flex items-center space-x-0.5 rounded-md bg-secondary/80 p-0.5 text-sm">
      <LanguageButton targetLang="english" label="ENG" />
      
      <LanguageButton 
        targetLang="tibetan"
        className={cn(
          "w-auto p-0 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:hover:bg-primary/10",
          language === 'tibetan' ? '!bg-primary/10' : ''
        )}
      >
        {language === 'tibetan' ? (
            <div className="flex items-center justify-center w-full h-full bg-primary rounded-[5px] p-0.5 gap-0.5">
                <ScriptToggleButton active={tibetanScript === 'tibetan'} onClick={(e) => handleScriptClick(e, setTibetanScript, 'tibetan')} label="བོད་ཡིག" />
                <ScriptToggleButton active={tibetanScript === 'tibetan-translit'} onClick={(e) => handleScriptClick(e, setTibetanScript, 'tibetan-translit')} label="TIB" />
            </div>
        ) : (
            <span className="px-2">TIB</span>
        )}
      </LanguageButton>

      <LanguageButton 
        targetLang="sanskrit"
        className={cn(
          "w-auto p-0 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:hover:bg-primary/10",
          language === 'sanskrit' ? '!bg-primary/10' : ''
        )}
      >
        {language === 'sanskrit' ? (
            <div className="flex items-center justify-center w-full h-full bg-primary rounded-[5px] p-0.5 gap-0.5">
                <ScriptToggleButton active={sanskritScript === 'sanskrit-devanagari'} onClick={(e) => handleScriptClick(e, setSanskritScript, 'sanskrit-devanagari')} label="संस्कृत" />
                <ScriptToggleButton active={sanskritScript === 'sanskrit-translit'} onClick={(e) => handleScriptClick(e, setSanskritScript, 'sanskrit-translit')} label="SKT" />
            </div>
        ) : (
             <span className="px-2">SKT</span>
        )}
      </LanguageButton>
    </div>
  );
}
