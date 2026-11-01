import { API_BASE } from '../utils/api';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MenuEditor from '../components/MenuEditor';
import MenuQRCode from '../components/MenuQRCode';
import { safeStorage } from '../utils/storage';

// Types from our FastAPI Backend

interface Restaurant {
  id: number;
  name: string;
  contact_phone: string;
  status: string;
  theme: string;
  description?: string;
  slug?: string;
  original_menu_image?: string;
  created_at: string;
  menus: any[];
}


export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(() => safeStorage.getItem('adminToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!token);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Publish Modal States
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('cafe');
  const [publishResult, setPublishResult] = useState<{url: string, theme: string} | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Restaurant Edit States
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [editedRestaurantName, setEditedRestaurantName] = useState("");
  const [editedRestaurantDesc, setEditedRestaurantDesc] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', 'admin');
      formData.append('password', passwordInput);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        safeStorage.setItem('adminToken', data.access_token);
        setIsAuthenticated(true);
        setAuthError(false);
      } else {
        setAuthError(true);
        setPasswordInput('');
      }
    } catch {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
        setSelectedRestaurant(current => current
          ? data.find((r: Restaurant) => r.id === current.id) || null
          : null);
      } else if (res.status === 401) {
        // Token expired or invalid
        safeStorage.removeItem('adminToken');
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurants();
    }
  }, [isAuthenticated, fetchRestaurants]);

  const handleDeleteRestaurant = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client et son menu ?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/restaurants/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (selectedRestaurant?.id === id) setSelectedRestaurant(null);
        fetchRestaurants();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateRestaurantInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/restaurants/${selectedRestaurant?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editedRestaurantName, description: editedRestaurantDesc })
      });
      if (res.ok) {
        setIsEditingRestaurant(false);
        fetchRestaurants();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishSubmit = async () => {
    if (!selectedRestaurant) return;
    setIsPublishing(true);
    
    try {
      const res = await fetch(`${API_BASE}/restaurants/${selectedRestaurant.id}/publish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: selectedTheme })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPublishResult(data);
        fetchRestaurants(); // Refresh to show active status
      }
    } catch (error) {
      console.error("Error publishing:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const closePublishModal = () => {
    setShowPublishModal(false);
    setPublishResult(null);
    setSelectedTheme('cafe');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-charcoal-light p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-accent-blue">Smart Admin</h1>
            <p className="text-gray-400 mt-2 text-sm">Accès Sécurisé</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mot de passe"
                className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                autoFocus
              />
            </div>
            {authError && <p className="text-red-400 text-sm text-center">Mot de passe incorrect</p>}
            <button type="submit" className="w-full btn-primary py-3 rounded-xl shadow-lg">
              Se Connecter
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;

  const themes = [
    { id: 'cafe', name: 'Café Élégant', emoji: '☕', desc: 'Tons chauds, minimaliste' },
    { id: 'restaurant', name: 'Restaurant Premium', emoji: '🍽️', desc: 'Tons sombres, doré' },
    { id: 'snack', name: 'Snack Moderne', emoji: '🍔', desc: 'Couleurs vives, dynamique' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Publish Modal Overlay */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl relative"
            >
              <button onClick={closePublishModal} aria-label="Fermer" className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              
              {!publishResult ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Publier le Menu</h2>
                  <p className="text-gray-500 mb-8">Choisissez l'apparence du menu digital pour <strong>{selectedRestaurant?.name}</strong>.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {themes.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${selectedTheme === t.id ? 'border-accent-purple bg-accent-purple/5 shadow-md' : 'border-gray-200 hover:border-accent-purple/50'}`}
                      >
                        <div className="text-4xl mb-3">{t.emoji}</div>
                        <h3 className="font-bold text-gray-900">{t.name}</h3>
                        <p className="text-xs text-gray-500 mt-2">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handlePublishSubmit} 
                    disabled={isPublishing}
                    className="w-full btn-primary py-4 text-lg shadow-lg flex justify-center items-center gap-2"
                  >
                    {isPublishing ? 'Création en cours...' : '🚀 Confirmer & Générer QR Code'}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Menu Publié avec Succès !</h2>
                  <p className="text-gray-500 mb-8">Le client peut maintenant utiliser ce QR Code.</p>
                  
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                    <MenuQRCode slug={selectedRestaurant?.slug || ''} name={selectedRestaurant?.name} tone="light" />
                    <p className="mt-5 text-sm text-gray-500">Thème appliqué : <strong>{themes.find(t=>t.id===publishResult.theme)?.name}</strong></p>
                  </div>
                  
                  <button onClick={closePublishModal} className="mt-8 text-gray-500 hover:text-gray-800 underline">Retour au tableau de bord</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full md:w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto z-10">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-accent-blue">Smart Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos extractions IA</p>
        </div>
        
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Restaurants Récents</h2>
          {restaurants.map(rest => (
            <div 
              key={rest.id}
              onClick={() => setSelectedRestaurant(rest)}
              className={`p-4 rounded-xl cursor-pointer transition-all mb-2 border ${selectedRestaurant?.id === rest.id ? 'bg-accent-purple/5 border-accent-purple shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="font-bold text-gray-900">{rest.name}</div>
              <div className="text-sm text-gray-500 mt-1">📞 {rest.contact_phone}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rest.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {rest.status === 'active' ? 'Publié (Live)' : 'En attente'}
                </span>
                <span className="text-xs text-gray-400">{new Date(rest.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {restaurants.length === 0 && (
            <div className="text-center p-4 text-gray-500 text-sm border border-dashed rounded-xl">Aucun restaurant pour le moment.</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto h-screen p-8 bg-gray-50 relative z-0">
        <AnimatePresence mode="wait">
          {!selectedRestaurant ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-gray-400"
            >
              <div className="text-6xl mb-4">📋</div>
              <p>Sélectionnez un restaurant pour réviser son menu IA.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={selectedRestaurant.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 mr-4">
                  {!isEditingRestaurant ? (
                    <>
                      <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-4">
                        {selectedRestaurant.name}
                        <button onClick={() => {
                          setEditedRestaurantName(selectedRestaurant.name);
                          setEditedRestaurantDesc(selectedRestaurant.description || "");
                          setIsEditingRestaurant(true);
                        }} className="text-sm font-normal text-accent-purple hover:underline">
                          ✏️ Modifier Infos
                        </button>
                      </h1>
                      {selectedRestaurant.description && (
                        <p className="text-gray-600 mt-2 italic font-serif">"{selectedRestaurant.description}"</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedRestaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          Statut: {selectedRestaurant.status.toUpperCase()}
                        </span>
                        <p className="text-gray-500 text-sm">Généré par Gemini</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nom du restaurant</label>
                        <input 
                          type="text" 
                          value={editedRestaurantName} 
                          onChange={e => setEditedRestaurantName(e.target.value)}
                          className="w-full text-xl font-bold bg-gray-50 border border-gray-200 rounded p-2 focus:ring-1 focus:ring-accent-purple"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Description (Générée par l'IA)</label>
                        <textarea 
                          value={editedRestaurantDesc} 
                          onChange={e => setEditedRestaurantDesc(e.target.value)}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded p-2 focus:ring-1 focus:ring-accent-purple"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleUpdateRestaurantInfo} className="btn-primary text-xs py-1.5 px-3">Enregistrer</button>
                        <button onClick={() => setIsEditingRestaurant(false)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded px-3 py-1.5 text-xs font-medium">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <button 
                    onClick={() => setShowPublishModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all font-medium text-sm shadow-sm whitespace-nowrap"
                  >
                    {selectedRestaurant.status === 'active' ? 'Republier / Changer Thème' : 'Approuver & Publier'}
                  </button>
                  <button onClick={() => handleDeleteRestaurant(selectedRestaurant.id)} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm shadow-sm whitespace-nowrap">
                    Supprimer Restaurant
                  </button>
                </div>
              </div>

              {(() => {
                if (!selectedRestaurant.original_menu_image) return null;
                let images = [];
                try {
                  if (selectedRestaurant.original_menu_image.startsWith('[')) {
                    images = JSON.parse(selectedRestaurant.original_menu_image);
                  } else {
                    images = [selectedRestaurant.original_menu_image];
                  }
                } catch {
                  images = [selectedRestaurant.original_menu_image];
                }
                
                return (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Image(s) Originale(s) du Client (Pour Vérification)</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {images.map((img: string, idx: number) => (
                        <div key={idx} className="flex-shrink-0 border border-gray-200 rounded-lg bg-gray-50 flex justify-center items-center p-2 max-h-80">
                          <img src={img} alt={`Menu original ${idx + 1}`} className="max-h-72 w-auto object-contain rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <MenuEditor 
                restaurant={selectedRestaurant} 
                token={token || ""} 
                onUpdate={fetchRestaurants} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
