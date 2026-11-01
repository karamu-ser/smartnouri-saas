import { motion, useReducedMotion } from 'framer-motion';
import { QrCode, Zap, Palette, Smartphone, Image, Clock, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';

const featuresList: { titleKey: TranslationKey; descKey: TranslationKey; icon: LucideIcon }[] = [
  { titleKey: 'feature_1_title', descKey: 'feature_1_desc', icon: QrCode },
  { titleKey: 'feature_2_title', descKey: 'feature_2_desc', icon: Zap },
  { titleKey: 'feature_3_title', descKey: 'feature_3_desc', icon: Palette },
  { titleKey: 'feature_4_title', descKey: 'feature_4_desc', icon: Smartphone },
  { titleKey: 'feature_5_title', descKey: 'feature_5_desc', icon: Image },
  { titleKey: 'feature_6_title', descKey: 'feature_6_desc', icon: Clock },
];

export default function Features() {
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.07 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.4 } },
  };

  return (
    <section id="fonctionnalites" className="section-padding bg-charcoal text-white" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-14"
        >
          <p className="section-eyebrow">{lang === 'fr' ? 'Tout est dans le détail' : 'Every detail counts'}</p>
          <h2 id="features-heading" className="text-3xl leading-[1.15] font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            {t('features_title')}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          {featuresList.map(({ titleKey, descKey, icon: Icon }, index) => (
            <motion.div key={titleKey} variants={itemVariants} className="surface-card rounded-2xl p-6 sm:p-7 lg:p-8">
              <div className="mb-7 flex items-start justify-between">
                <div className="surface-icon">
                  <Icon size={24} strokeWidth={1.6} className="rotate-6" aria-hidden="true" />
                </div>
                <span aria-hidden="true" className="pt-1 font-mono text-[11px] tracking-wider text-white/20">0{index + 1}</span>
              </div>
              <h3 className="mb-3 text-lg font-semibold tracking-tight text-white">{t(titleKey)}</h3>
              <p className="max-w-sm text-sm leading-7 text-white/55">{t(descKey)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
