import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Layers3, Menu, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t, lang, setLang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setIsOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileMenuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        headerRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const navLinks = [
    { href: '#accueil', label: t('nav_home') },
    { href: '#comment-ca-marche', label: t('nav_how') },
    { href: '#demo', label: t('nav_demo') },
    { href: '#tarifs', label: t('nav_pricing') },
    { href: '#faq', label: t('nav_faq') },
  ];
  const closeMenu = () => setIsOpen(false);
  const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300';

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        isScrolled || isOpen
          ? 'border-white/10 bg-[#101015]/95 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl'
          : 'border-white/[0.06] bg-[#101015]/75 backdrop-blur-lg'
      }`}
    >
      <nav aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'} className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#accueil" className={`flex shrink-0 items-center gap-2 rounded-lg sm:gap-2.5 ${focusStyle}`} onClick={closeMenu} aria-label={lang === 'fr' ? 'SmartNouri — Accueil' : 'SmartNouri — Home'}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-300/40 bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.3),0_3px_0_#4c2682,0_6px_14px_rgba(139,92,246,0.2)] sm:h-9 sm:w-9">
            <Layers3 size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-[-0.04em] text-white sm:text-xl">Smart<span className="font-medium text-violet-300">Nouri</span><span className="text-violet-400">.</span></span>
        </a>

        <div className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={`rounded text-[13px] font-medium whitespace-nowrap text-white/60 transition-colors hover:text-white ${focusStyle}`}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-1" role="group" aria-label={lang === 'fr' ? 'Langue' : 'Language'}>
            {(['fr', 'en'] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setLang(language)}
                aria-label={language === 'fr' ? 'Français' : 'English'}
                aria-pressed={lang === language}
                className={`cursor-pointer rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors sm:px-2.5 ${focusStyle} ${lang === language ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/client" className={`hidden items-center gap-2 rounded text-[13px] font-medium text-white/70 transition-colors hover:text-white xl:flex ${focusStyle}`}>
            <UserRound size={15} aria-hidden="true" />
            {lang === 'fr' ? 'Connexion' : 'Log in'}
          </Link>
          <a href="#contact" className={`hidden items-center gap-2 rounded-xl border border-violet-300/40 bg-violet-400 px-4 py-2.5 text-[13px] font-semibold text-[#171020] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#7250a9] transition-colors hover:bg-violet-300 xl:inline-flex ${focusStyle}`}>
            {t('nav_cta')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button
            ref={menuButtonRef}
            type="button"
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white xl:hidden ${focusStyle}`}
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={lang === 'fr' ? (isOpen ? 'Fermer le menu' : 'Ouvrir le menu') : (isOpen ? 'Close menu' : 'Open menu')}
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation"
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="absolute inset-x-0 top-20 h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-white/5 bg-[#101015] px-5 py-8 sm:px-8 xl:hidden"
          >
            <nav aria-label={lang === 'fr' ? 'Navigation mobile' : 'Mobile navigation'} className="mx-auto flex max-w-xl flex-col gap-2">
              {navLinks.map((link, index) => (
                <a key={link.href} href={link.href} className={`flex items-center justify-between rounded-xl px-4 py-4 text-lg font-medium text-white/85 transition-colors hover:bg-white/5 hover:text-white ${focusStyle}`} onClick={closeMenu}>
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="font-mono text-xs text-violet-300/40">0{index + 1}</span>
                </a>
              ))}
              <div className="my-4 h-px bg-white/10" />
              <Link to="/client" className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-white/70 ${focusStyle}`} onClick={closeMenu}>
                <UserRound size={18} aria-hidden="true" />
                {lang === 'fr' ? 'Espace client' : 'Client area'}
              </Link>
              <a href="#contact" className={`mt-3 flex items-center justify-between rounded-xl border border-violet-300/40 bg-violet-400 px-5 py-4 font-semibold text-[#171020] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#7250a9] ${focusStyle}`} onClick={closeMenu}>
                {t('nav_cta')}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
