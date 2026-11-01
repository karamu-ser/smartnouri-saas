import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';
import { WHATSAPP_URL } from '../utils/constants';

export default function FinalCTA() {
  const { t } = useLanguage();

  return (
    <motion.section
      className="section-padding bg-gradient-to-br from-charcoal-light via-charcoal to-charcoal-light text-white relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {t('final_title')}
        </h2>
        <p className="text-xl text-white/50 mb-10 leading-relaxed max-w-2xl mx-auto">
          {t('final_subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="#contact" className="btn-primary w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-semibold transition-transform hover:scale-105">
            {t('final_cta')}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:-translate-y-1 transition-all w-full sm:w-auto"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {t('final_whatsapp')}
          </a>
        </div>
        
        <p className="mt-8 text-sm text-white/30 tracking-wide uppercase font-semibold">
          {t('final_morocco')}
        </p>
      </div>
    </motion.section>
  );
}
