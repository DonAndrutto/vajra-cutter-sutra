"use client";

import { Language, useAppContext } from "@/context/app-context";

export default function LanguageSelector() {
  const {language, setLanguage, setView, tibetanScript, setTibetanScript, sanskritScript, setSanskritScript} = useAppContext();
  const select = (value: Language) => {setLanguage(value); setView('sutra');};
  return <div className="language-selector" aria-label="Text language">
    {(['english','tibetan','sanskrit'] as const).map((value, index) => <button type="button" key={value}
      className={`lang-btn ${language === value ? 'active' : ''}`} aria-label={value[0].toUpperCase() + value.slice(1)} aria-pressed={language === value}
      onClick={() => select(value)}>{['ENG','TIB','SKT'][index]}</button>)}
    {language === 'tibetan' && <div className="script-selector" aria-label="Tibetan script">
      <button type="button" className={`lang-btn ${tibetanScript === 'tibetan' ? 'active' : ''}`} aria-label="Tibetan script" aria-pressed={tibetanScript === 'tibetan'} onClick={() => setTibetanScript('tibetan')}>བོད་ཡིག</button>
      <button type="button" className={`lang-btn ${tibetanScript === 'tibetan-translit' ? 'active' : ''}`} aria-label="Tibetan phonetics" aria-pressed={tibetanScript === 'tibetan-translit'} onClick={() => setTibetanScript('tibetan-translit')}>PHO</button>
    </div>}
    {language === 'sanskrit' && <div className="script-selector" aria-label="Sanskrit script">
      <button type="button" className={`lang-btn ${sanskritScript === 'sanskrit-devanagari' ? 'active' : ''}`} aria-label="Devanagari script" aria-pressed={sanskritScript === 'sanskrit-devanagari'} onClick={() => setSanskritScript('sanskrit-devanagari')}>संस्कृत</button>
      <button type="button" className={`lang-btn ${sanskritScript === 'sanskrit-translit' ? 'active' : ''}`} aria-label="Sanskrit phonetics" aria-pressed={sanskritScript === 'sanskrit-translit'} onClick={() => setSanskritScript('sanskrit-translit')}>PHO</button>
    </div>}
  </div>;
}
