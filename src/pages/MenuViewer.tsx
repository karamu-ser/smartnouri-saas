import { API_BASE } from '../utils/api';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface Restaurant {
  id: number;
  name: string;
  theme: string;
  description?: string;
  contact_phone?: string;
  menus: { categories: Category[] }[];
}


export default function MenuViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/slug/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setRestaurant(data);
        if (data.menus.length > 0 && data.menus[0].categories.length > 0) {
          setActiveCategory(data.menus[0].categories[0].id);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchMenu();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#181818]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full mb-4"
        />
      </div>
    );
  }

  if (error || !restaurant || restaurant.menus.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-[#181818] text-white font-serif">Menu introuvable.</div>;
  }

  const menu = restaurant.menus[0];
  const theme = restaurant.theme || 'restaurant'; // Default to restaurant for testing this design
  const isRestaurant = theme === 'restaurant';
  const isCafe = theme === 'cafe';

  // --- CAFE THEME (From user's HTML snippet, optimized for full screen & mobile) ---
  if (isCafe) {
    return (
      <div className="min-h-screen bg-[#1a1614] text-[#f5f0eb] pb-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Hero Image */}
        <div className="w-full h-64 md:h-80 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a1614] z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
            alt="Cafe ambiance" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full max-w-3xl mx-auto px-6 relative z-20 -mt-16">
          <header className="text-center mb-10 pb-6">
            <h1 className="text-4xl md:text-5xl font-semibold text-[#d4a373] mb-3 tracking-[0.5px] drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {restaurant.name}
            </h1>
            <p className="text-sm md:text-base text-[#b3a69b] italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              {restaurant.description || "Un havre de paix aux tons chauds"}
            </p>
          </header>

          <div className="space-y-12 bg-[#241f1c]/50 p-6 md:p-10 rounded-[32px] border border-[#d4a373]/10 backdrop-blur-md">
            {menu.categories.map((category) => (
              <section key={category.id} className="category">
                <h2 className="text-2xl text-[#d4a373] mb-6 flex items-center gap-3 border-b border-[#d4a373]/10 pb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <span className="text-[#d4a373]/50 text-xl">☕</span> {category.name}
                </h2>
                
                <div className="space-y-5">
                  {category.items.map((item, index) => (
                    <div key={item.id} className={`flex justify-between items-start pb-5 ${index !== category.items.length - 1 ? 'border-b border-dashed border-[#d4a373]/15' : ''}`}>
                      {item.image_url && (
                        <div className="shrink-0 mr-4">
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-[#d4a373]/20 shadow-sm" />
                        </div>
                      )}
                      <div className="flex-grow pr-6">
                        <div className="font-medium text-[1.05rem] mb-1.5">{item.name}</div>
                        {item.description && (
                          <div className="text-[0.85rem] text-[#b3a69b] leading-[1.5]">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-[1.05rem] text-[#d4a373] whitespace-nowrap mt-0.5">
                        {item.price} DH
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="text-center mt-12 pt-6 border-t border-[#d4a373]/15 text-[0.75rem] text-[#b3a69b] tracking-[1.5px] uppercase">
            Propulsé par Smart Nouri • 2026
          </footer>
        </div>
      </div>
    );
  }

  // --- RESTAURANT THEME (Inspired by the provided dark, elegant print menu image) ---
  if (isRestaurant) {
    return (
      <div className="min-h-screen bg-[#181818] text-[#E5E5E5] font-serif selection:bg-white/20">
        
        {/* Header Section */}
        <div className="pt-16 pb-12 px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: '0em' }}
            animate={{ opacity: 1, letterSpacing: '0.2em' }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-7xl font-light uppercase tracking-[0.2em] mb-4 text-white"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            MENU
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-sm md:text-base tracking-[0.15em] text-gray-400 uppercase font-sans"
          >
            {restaurant.name}
          </motion.p>
        </div>

        {/* Digital Navigation (Subtle, keeping the print aesthetic clean) */}
        <div className="sticky top-0 z-50 bg-[#181818]/95 backdrop-blur-md border-b border-white/5 py-4 mb-8">
          <div className="flex overflow-x-auto hide-scrollbar px-6 gap-8 items-center justify-center max-w-4xl mx-auto">
            {menu.categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`whitespace-nowrap text-xs md:text-sm tracking-[0.2em] uppercase transition-all duration-500 ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Content (Two Column Layout on Desktop, mirroring the image) */}
        <div className="max-w-5xl mx-auto px-6 md:px-12 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
            {menu.categories.map((category) => (
              <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                
                {/* Category Title */}
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-xl md:text-2xl uppercase tracking-[0.15em] text-white mb-8 text-center md:text-left"
                  style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
                >
                  {category.name}
                </motion.h2>
                
                {/* Items */}
                <div className="space-y-5">
                  {category.items.map((item, itemIdx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: itemIdx * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-end justify-between w-full">
                        {/* Item Name */}
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-full border border-gray-700/50 grayscale hover:grayscale-0 transition-all duration-500" />
                          )}
                          <span className="text-gray-300 font-sans tracking-wide text-sm md:text-base leading-none">
                            {item.name}
                          </span>
                        </div>
                        
                        {/* Dotted Leader */}
                        <div className="flex-grow mx-4 border-b-2 border-dotted border-gray-700/60 relative -top-1.5 opacity-50 transition-opacity group-hover:opacity-100"></div>
                        
                        {/* Price */}
                        <span className="text-gray-200 font-sans tracking-widest text-sm md:text-base whitespace-nowrap leading-none">
                          {item.price} DH
                        </span>
                      </div>
                      
                      {/* Optional Description */}
                      {item.description && (
                        <p className="text-gray-500 text-xs md:text-sm mt-2 italic font-serif leading-relaxed pr-12">
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Image Area (Rustic food photography as seen in the mockup) */}
        <div className="w-full relative h-[400px] md:h-[500px]">
          {/* Overlay gradient to blend dark background into image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#181818] via-[#181818]/60 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
          
          {/* Unsplash Image matching the rustic meat/wine aesthetic */}
          <img 
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Rustic food" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="absolute bottom-10 left-0 right-0 z-20 text-center px-6">
            <p className="text-gray-300 tracking-[0.2em] text-xs uppercase mb-2">Available On Your Phone</p>
            <p className="text-gray-400 font-sans text-xs tracking-widest">
              {restaurant.contact_phone} | www.smartnouri.cloud
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- SNACK THEME (STREET FOOD / NEON DARK) ---
  return (
    <div className="min-h-screen pb-24 bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header & Navigation */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="px-6 py-5 flex flex-col items-center justify-center relative">
          {/* Subtle neon glow behind title */}
          <div className="absolute inset-0 bg-orange-500/10 blur-[30px] rounded-full pointer-events-none"></div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 z-10 text-center">
            {restaurant.name}
          </h1>
          <p className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase mt-1 z-10 text-center">
            {restaurant.description || "Street Food & Snacks"}
          </p>
        </div>

        {/* Categories Pills Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar px-6 pb-4 pt-1 gap-3 items-center">
          {menu.categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`whitespace-nowrap px-5 py-2 rounded-full border text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive 
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Content */}
      <div className="p-4 md:p-8 max-w-3xl mx-auto mt-6">
        {menu.categories.map(category => (
          <div key={category.id} id={`category-${category.id}`} className="mb-14 scroll-mt-40">
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-yellow-500">{category.name}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
            </div>
            
            {/* Items Grid/List */}
            <div className="space-y-4">
              {category.items.map(item => (
                <div 
                  key={item.id} 
                  className="group relative bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-orange-500/40 hover:bg-white/[0.05] rounded-3xl overflow-hidden transition-all duration-300 shadow-lg flex flex-col sm:flex-row"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-yellow-500/5 transition-all duration-500 pointer-events-none"></div>

                  {item.image_url && (
                    <div className="w-full sm:w-40 h-48 sm:h-auto shrink-0 relative overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      {/* Gradient overlay on image for better blending */}
                      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-l from-[#0a0a0a]/80 via-transparent to-transparent"></div>
                    </div>
                  )}
                  
                  <div className="p-5 md:p-6 flex-1 flex flex-col justify-center relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-wide mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-sm">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-end">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-500">
                          {item.price}
                        </span>
                        <span className="text-xs font-bold text-orange-500/70 tracking-widest mt-1">DH</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
