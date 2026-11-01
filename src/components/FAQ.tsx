import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
    { question: t('faq_q7'), answer: t('faq_a7') },
    { question: t('faq_q8'), answer: t('faq_a8') },
  ];

  return (
    <motion.section
      id="faq"
      className="section-padding bg-charcoal"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          {t('faq_title')}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl mb-3 overflow-hidden border border-white/[0.06] bg-white/[0.03]"
            >
              <button
                className="w-full text-left p-5 sm:p-6 flex justify-between items-center cursor-pointer"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-base sm:text-lg text-white pr-4">
                  {faq.question}
                </span>
                <span className="text-white/60 flex-shrink-0">
                  <svg
                    className={`w-6 h-6 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-45' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
