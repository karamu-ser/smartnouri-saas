
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';

const Problem = () => {
  const { t } = useLanguage();

  return (
    <section id="probleme" className="section-padding bg-charcoal overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-16"
        >
          {t('problem_title')}
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-8 relative">
          
          {/* Arrow between cards on desktop */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-charcoal-lighter rounded-full border border-white/10 items-center justify-center text-accent-purple z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>

          {/* LEFT Card - Before */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="surface-card rounded-2xl p-6 sm:p-8 md:p-10 border border-red-500/20"
          >
            <div className="text-red-400 font-medium mb-8 text-xl flex items-center gap-2">
              📄 {t('problem_before')}
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">❌</span>
                <p className="text-white/80 text-base">{t('problem_pain_1')}</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">❌</span>
                <p className="text-white/80 text-base">{t('problem_pain_2')}</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">❌</span>
                <p className="text-white/80 text-base">{t('problem_pain_3')}</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT Card - After */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="surface-card rounded-2xl p-6 sm:p-8 md:p-10 border border-green-500/20"
          >
            <div className="text-green-400 font-medium mb-8 text-xl flex items-center gap-2">
              📱 {t('problem_after')}
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">✅</span>
                <p className="text-white/80 text-base">{t('problem_benefit_1')}</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">✅</span>
                <p className="text-white/80 text-base">{t('problem_benefit_2')}</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">✅</span>
                <p className="text-white/80 text-base">{t('problem_benefit_3')}</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Problem;
