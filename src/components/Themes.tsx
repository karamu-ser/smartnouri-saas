import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';

const Themes = () => {
  const { t } = useLanguage();
  const [activeTheme, setActiveTheme] = useState(0);

  const themes = [
    { id: 'theme1', name: t('theme_1'), image: '/images/theme-cafe.jpg' },
    { id: 'theme2', name: t('theme_2'), image: '/images/theme-restaurant.jpg' },
    { id: 'theme3', name: t('theme_3'), image: '/images/theme-snack.jpg' },
  ];

  return (
    <section id="themes" className="section-padding bg-charcoal-light text-white overflow-hidden">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">{t('themes_title')}</h2>
          <p className="text-white/50 text-lg">{t('themes_subtitle')}</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-full p-1.5 flex max-w-full flex-wrap justify-center gap-1 mb-10">
            {themes.map((theme, index) => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(index)}
                aria-pressed={activeTheme === index}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTheme === index
                    ? 'bg-white text-charcoal shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-4xl aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-accent-purple/20 blur-[100px] rounded-full scale-150 translate-y-1/4"></div>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeTheme}
                src={themes[activeTheme].image}
                loading="lazy"
                width={1376}
                height={768}
                alt={themes[activeTheme].name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full h-full object-cover rounded-2xl relative z-10 border border-white/10"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Themes;
