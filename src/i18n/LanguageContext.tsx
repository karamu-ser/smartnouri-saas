import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';
import { safeStorage } from '../utils/storage';
import { LanguageContext } from './useLanguage';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = safeStorage.getItem('smartnouri-lang');
    if (saved === 'fr' || saved === 'en') return saved;
    return 'fr';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    safeStorage.setItem('smartnouri-lang', newLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
