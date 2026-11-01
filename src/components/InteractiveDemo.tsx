import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isUpdating?: boolean;
}

const initialItems: MenuItem[] = [
  { id: '1', name: 'Cappuccino', price: 18, category: 'Café' },
  { id: '2', name: 'Espresso', price: 14, category: 'Café' },
  { id: '3', name: 'Thé à la menthe', price: 12, category: 'Boissons' },
  { id: '4', name: "Jus d'orange", price: 20, category: 'Boissons' },
  { id: '5', name: 'Croissant', price: 8, category: 'Petit-déjeuner' },
  { id: '6', name: 'Cheesecake', price: 35, category: 'Desserts' },
];

const categories = ['Café', 'Boissons', 'Petit-déjeuner', 'Desserts'];

const InteractiveDemo: React.FC = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState('Café');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [priceError, setPriceError] = useState(false);
  const updateTimers = useRef(new Map<string, ReturnType<typeof window.setTimeout>>());

  useEffect(() => {
    const timers = updateTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditPrice(String(item.price));
    setPriceError(false);
  };

  const handleSave = (id: string) => {
    const nextPrice = Number(editPrice);
    if (editPrice.trim() === '' || !Number.isFinite(nextPrice) || nextPrice < 0) {
      setPriceError(true);
      return;
    }

    setPriceError(false);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price: nextPrice, isUpdating: true } : item
      )
    );
    setEditingId(null);

    // Clear the update highlight after 2 seconds
    window.clearTimeout(updateTimers.current.get(id));
    const timer = window.setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isUpdating: false } : item
        )
      );
      updateTimers.current.delete(id);
    }, 2000);
    updateTimers.current.set(id, timer);
  };

  const filteredItems = items.filter((item) => item.category === activeCategory);

  return (
    <section id="demo" className="py-24 bg-charcoal-light text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('demo_title')}
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            {t('demo_subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          {/* Dashboard LEFT */}
          <div className="surface-card w-full min-w-0 lg:flex-1 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <h3 className="min-w-0 text-xl font-bold text-white">{t('demo_dashboard')}</h3>
              <div className="flex shrink-0 gap-2" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center p-4 rounded-xl transition-colors duration-300 ${item.isUpdating ? 'bg-accent-purple/20 border border-accent-purple/50' : 'bg-charcoal border border-white/5'}`}
                >
                  <div className="min-w-0 break-words">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-white/50">{item.category}</div>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
                    {editingId === item.id ? (
                      <div className="min-w-0 sm:max-w-40">
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          aria-label={`${lang === 'fr' ? 'Prix de' : 'Price of'} ${item.name} (DH)`}
                          aria-invalid={priceError}
                          aria-describedby={priceError ? `price-error-${item.id}` : undefined}
                          value={editPrice}
                          onChange={(e) => { setEditPrice(e.target.value); setPriceError(false); }}
                          className="w-24 max-w-full bg-charcoal border border-accent-purple rounded px-2 py-1 text-white font-mono text-right"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(item.id);
                          }}
                          onBlur={() => handleSave(item.id)}
                        />
                        {priceError && (
                          <p id={`price-error-${item.id}`} role="alert" className="mt-2 text-xs text-red-300">
                            {lang === 'fr' ? 'Saisissez un prix valide, supérieur ou égal à 0.' : 'Enter a valid price of 0 or more.'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="relative min-w-0 break-all font-mono font-bold text-right sm:max-w-32">
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={item.price}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className={`inline-block ${item.isUpdating ? 'text-accent-purple' : 'text-white'}`}
                            >
                              {item.price} DH
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleEdit(item)}
                          aria-label={`${t('demo_edit')} ${item.name}`}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/10 cursor-pointer"
                        >
                          {t('demo_edit')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div role="status" aria-live="polite" aria-atomic="true">
              <AnimatePresence>
                {items.some(i => i.isUpdating) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 p-3 rounded-lg bg-accent-purple/20 text-accent-purple text-sm text-center font-medium border border-accent-purple/30"
                  >
                    {t('demo_updated')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Phone Mockup RIGHT */}
          <motion.div 
            className="flex-shrink-0 w-[260px] max-w-full sm:w-[280px] h-[540px] sm:h-[580px] rounded-[36px] sm:rounded-[40px] border-[6px] sm:border-[8px] border-charcoal-lighter bg-charcoal overflow-hidden relative shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Inline Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-charcoal-lighter rounded-b-2xl z-20 flex justify-center items-end pb-1">
              <div className="w-12 h-1.5 bg-white/10 rounded-full"></div>
            </div>

            {/* Phone Content */}
            <div className="h-full flex flex-col relative z-10 pt-8">
              <div className="px-6 py-4 bg-charcoal shadow-md z-10 sticky top-0">
                <h3 className="text-xl font-bold text-center mb-4">{t('demo_cafe_name')}</h3>
                
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      aria-pressed={activeCategory === cat}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === cat 
                          ? 'bg-accent-purple text-white' 
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide pb-20">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map(item => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={item.id}
                      className="bg-white/5 rounded-2xl p-4 border border-white/5 flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0 break-words">
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-[10px] text-white/40 mt-1">{item.category}</div>
                      </div>
                      <div className="min-w-0 max-w-[45%] shrink-0 break-all font-mono font-bold text-accent-purple text-sm relative">
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={item.price}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="inline-block"
                          >
                            {item.price} DH
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Phone bottom indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-20"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
