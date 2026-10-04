"use client";

import { useAppContext } from "@/context/app-context";
import LanguageSelector from "@/components/language-selector";
import InstallAppButton from "@/components/install-app-button";
import ReaderIcon from "@/components/reader-icon";
import { BookMarked, BookOpen, List } from "lucide-react";

export default function Header({isVisible}: {isVisible: boolean}) {
  const {view, setView, setIsDonationModalOpen} = useAppContext();
  return <header className="sticky-stack" id="stickyStack" hidden={!isVisible}>
    <div className="app-header">
      <div className="header-inner">
        <div className="header-lead">
          <button type="button" className="intro-btn" aria-label="Introduction" aria-pressed={view === 'introduction'}
            onClick={() => setView(view === 'introduction' ? 'sutra' : 'introduction')}>
            <ReaderIcon name="book" /><span className="intro-btn-label">Introduction</span>
          </button>
        </div>
        <h1 className="header-title">Vajra-Cutter Sutra</h1>
        <div className="header-controls">
          <button type="button" className="donate-link" onClick={() => setIsDonationModalOpen(true)}>Donate</button>
          <InstallAppButton />
        </div>
        <div className="header-options"><LanguageSelector /></div>
      </div>
    </div>
    <nav className="tabs-bar" aria-label="Reader views">
      <div className="tabs-inner">
        <button type="button" className={`tab-btn ${view === 'sutra' ? 'active' : ''}`} aria-label="Sutra" aria-pressed={view === 'sutra'} onClick={() => setView('sutra')}><BookOpen className="tab-icon" /><span>Sutra</span></button>
        <button type="button" className={`tab-btn ${view === 'index' ? 'active' : ''}`} aria-label="Index" aria-expanded={view === 'index'} onClick={() => setView('index')}><List className="tab-icon" /><span>Index</span></button>
        <button type="button" className={`tab-btn ${view === 'glossary' ? 'active' : ''}`} aria-label="Glossary" aria-expanded={view === 'glossary'} onClick={() => setView('glossary')}><BookMarked className="tab-icon" /><span>Glossary</span></button>
      </div>
    </nav>
  </header>;
}
