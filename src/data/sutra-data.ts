
import { sutraData as sutraEnglish } from '@/data/sutra-english';
import { sutraData as sutraTibetan } from '@/data/sutra-tibetan';
import { sutraData as sutraSanskrit } from '@/data/sutra-sanskrit';
import { sutraData as sutraTibetanPhonetic } from '@/data/sutra-tibetan-phonetic';
import { sutraData as sutraSanskritPhonetic } from '@/data/sutra-sanskrit-phonetic';


export type Language = 'sanskrit-devanagari' | 'sanskrit-translit' | 'tibetan' | 'tibetan-translit' | 'english';

export type SutraSectionContent = {
    [key in Language]?: string[];
};

export interface SutraSection {
  section: number;
  title: {
    [key in Language]?: string;
  };
  content: SutraSectionContent;
}

const mergeSutraData = (): SutraSection[] => {
  const merged: { [key: number]: SutraSection } = {};

  const processData = (data: SutraSection[], language: Language, titleLanguage?: Language) => {
    for (const section of data) {
      if (!merged[section.section]) {
        merged[section.section] = {
          section: section.section,
          title: {},
          content: {},
        };
      }
      if (section.content[language]) {
        merged[section.section].content[language] = section.content[language];
      }
      if (titleLanguage && section.title[titleLanguage]) {
          merged[section.section].title[titleLanguage] = section.title[titleLanguage];
      }
    }
  };

  processData(sutraEnglish, 'english', 'english');
  processData(sutraTibetan, 'tibetan', 'tibetan');
  processData(sutraSanskrit, 'sanskrit-devanagari', 'sanskrit-devanagari');
  processData(sutraTibetanPhonetic, 'tibetan-translit', 'english');
  processData(sutraSanskritPhonetic, 'sanskrit-translit', 'english');

  return Object.values(merged).sort((a, b) => a.section - b.section);
};


export const sutraData: SutraSection[] = mergeSutraData();
