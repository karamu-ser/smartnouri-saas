import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';
import type { TranslationKey } from '../i18n/translations';

const Pricing = () => {
  const { t } = useLanguage();

  return (
    <section id="tarifs" className="section-padding bg-charcoal">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">{t('pricing_title')}</h2>
          <p className="text-text-secondary text-lg">{t('pricing_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
          {/* Card 1: Création - FREE */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="surface-card rounded-2xl p-8 md:p-10 border border-green-500/30 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"></div>
            <div className="flex flex-wrap gap-3 justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-white">{t('pricing_creation')}</h3>
              <span className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {t('pricing_popular')}
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl sm:text-6xl font-black text-green-400">{t('pricing_creation_price')}</span>
              </div>
              <p className="text-green-400/70 mt-2 font-semibold">{t('pricing_creation_period')}</p>
            </div>
            
            <div className="border-t border-white/10 my-6"></div>

            <ul className="space-y-4 mb-8 flex-grow">
              {(['pricing_creation_f1', 'pricing_creation_f2', 'pricing_creation_f3', 'pricing_creation_f4', 'pricing_creation_f5', 'pricing_creation_f6'] as TranslationKey[]).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/20 rounded-full p-1 flex-shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{t(key)}</span>
                </li>
              ))}
            </ul>
            <a href="#contact" className="btn-primary w-full mt-auto text-center block">
              {t('pricing_creation_cta')}
            </a>
          </motion.div>

          {/* Card 2: Maintenance - INCLUDED */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="surface-card rounded-2xl p-8 md:p-10 border border-white/[0.06] flex flex-col"
          >
            <h3 className="text-2xl font-bold text-white mb-6">{t('pricing_maintenance')}</h3>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl sm:text-6xl font-black text-white">{t('pricing_maintenance_price')}</span>
              </div>
              <p className="text-text-secondary mt-2 font-semibold">{t('pricing_maintenance_period')}</p>
            </div>
            
            <div className="border-t border-white/10 my-6"></div>

            <ul className="space-y-4 mb-8 flex-grow">
              {(['pricing_maintenance_f1', 'pricing_maintenance_f2', 'pricing_maintenance_f3', 'pricing_maintenance_f4'] as TranslationKey[]).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/20 rounded-full p-1 flex-shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{t(key)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div 
          className="mt-12 bg-green-500/10 rounded-2xl p-6 text-center max-w-4xl mx-auto border border-green-500/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-green-400 font-semibold text-lg">{t('pricing_trust')}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
