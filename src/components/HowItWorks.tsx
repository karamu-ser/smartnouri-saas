import { motion, useReducedMotion } from 'framer-motion';
import { Upload, Palette, ScanLine, Pencil, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';

const steps: { icon: LucideIcon; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Upload, titleKey: 'how_step1_title', descKey: 'how_step1_desc' },
  { icon: Palette, titleKey: 'how_step2_title', descKey: 'how_step2_desc' },
  { icon: ScanLine, titleKey: 'how_step3_title', descKey: 'how_step3_desc' },
  { icon: Pencil, titleKey: 'how_step4_title', descKey: 'how_step4_desc' },
];

export default function HowItWorks() {
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.1 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.4 } },
  };

  return (
    <section id="comment-ca-marche" className="section-padding border-y border-white/[0.04] bg-charcoal-light" aria-labelledby="how-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-14"
        >
          <p className="section-eyebrow">{lang === 'fr' ? 'Du papier au digital' : 'From paper to digital'}</p>
          <h2 id="how-heading" className="mb-5 text-3xl leading-[1.15] font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            {t('how_title')}
          </h2>
          <p className="text-sm leading-7 text-white/50 sm:text-base">{t('how_subtitle')}</p>
        </motion.div>

        <motion.ol
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid list-none grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
        >
          {steps.map(({ titleKey, descKey, icon: Icon }, index) => (
            <motion.li key={titleKey} variants={item} className="surface-card rounded-2xl p-6 xl:p-7">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="surface-icon">
                  <Icon size={24} strokeWidth={1.6} className="rotate-6" aria-hidden="true" />
                </div>
                <span aria-hidden="true" className="rounded-full border border-white/[0.07] bg-black/10 px-2.5 py-1 font-mono text-[11px] text-violet-300/60">0{index + 1}</span>
              </div>
              <h3 className="mb-3 text-lg leading-snug font-semibold tracking-tight text-white">{t(titleKey)}</h3>
              <p className="text-sm leading-7 text-white/55">{t(descKey)}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
