import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { safeStorage } from '../utils/storage';
import { API_BASE, responseError } from '../utils/api';
import { WHATSAPP_URL } from '../utils/constants';
import MenuQRCode from '../components/MenuQRCode';


export default function ClientDashboard() {
  const [token, setToken] = useState<string | null>(() => safeStorage.getItem('clientToken'));
  const [identifier, setIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Edit State
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, is_available: true });

  const fetchRestaurant = async (authToken: string) => {
    setError('');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/client/restaurant`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      } else {
        setError(await responseError(res, 'Impossible de charger votre menu. Réessayez.'));
      }
    } catch {
      setError('Connexion interrompue. Réessayez pour charger votre menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRestaurant(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });
      if (res.ok) {
        const data = await res.json();
        safeStorage.setItem('clientToken', data.access_token);
        setToken(data.access_token);
      } else {
        setError(await responseError(res, 'Identifiant ou mot de passe incorrect.'));
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/client/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), recovery_code: recoveryCode.trim(), new_password: newPassword })
      });
      if (!res.ok) {
        setError(await responseError(res, 'Impossible de réinitialiser votre mot de passe.'));
        return;
      }
      setSuccessMsg('Votre mot de passe a été modifié. Connectez-vous avec le nouveau mot de passe.');
      setRecoveryCode('');
      setNewPassword('');
      setPassword('');
      setIsForgotPassword(false);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    safeStorage.removeItem('clientToken');
    setToken(null);
    setRestaurant(null);
  };

  const startEditing = (item: any) => {
    setEditingItem(item.id);
    setEditForm({ price: item.price, is_available: item.is_available });
  };

  const saveItem = async (itemId: number) => {
    try {
      const res = await fetch(`${API_BASE}/client/menu_items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingItem(null);
        fetchRestaurant(token!);
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-charcoal-light p-8 rounded-2xl max-w-md w-full border border-white/10"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isForgotPassword ? 'Mot de passe oublié' : 'Espace Client'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isForgotPassword ? 'Utilisez le code de récupération fourni à la création de votre menu. Aucun email nécessaire.' : 'Utilisez les accès affichés à la création de votre menu.'}
            </p>
          </div>
          
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div role="status" className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {successMsg}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="client-identifier" className="block text-sm text-gray-400 mb-1">Identifiant du menu ou email</label>
                <input 
                  id="client-identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="recovery-code" className="block text-sm text-gray-400 mb-1">Code de récupération</label>
                <input id="recovery-code" type="text" required autoComplete="off" autoCapitalize="none" spellCheck={false}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm text-gray-400 mb-1">Nouveau mot de passe</label>
                <input id="new-password" type="password" required minLength={12} maxLength={72} autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <p className="text-xs text-gray-400 mt-2">Au moins 12 caractères.</p>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-6"
              >
                {loading ? 'Modification...' : 'Changer mon mot de passe'}
              </button>
              <p className="text-sm text-gray-400">Vous n’avez pas de code de récupération ? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-orange-300 underline">Contactez l’assistance sur WhatsApp</a> pour récupérer l’accès après vérification.</p>
              <div className="mt-4 text-center">
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="client-identifier" className="block text-sm text-gray-400 mb-1">Identifiant du menu ou email</label>
                <input 
                  id="client-identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="client-password" className="block text-sm text-gray-400 mb-1">Mot de passe</label>
                <input 
                  id="client-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div className="flex justify-end mt-1">
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-6"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center pt-6 border-t border-white/10">
            <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
              &larr; Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!loading && !restaurant && error) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-charcoal-light border border-white/10 p-6 space-y-4 text-center">
          <p role="alert" className="text-red-300">{error}</p>
          <button type="button" className="btn-primary w-full" onClick={() => fetchRestaurant(token)}>Réessayer</button>
          <button type="button" className="text-gray-300 text-sm" onClick={handleLogout}>Retour à la connexion</button>
        </div>
      </div>
    );
  }

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal text-white">
      {/* Header */}
      <header className="bg-charcoal-light border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">{restaurant.name}</h1>
            <p className="text-xs text-gray-400">Espace d'édition</p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={`/menu/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors hidden sm:inline-block"
            >
              Voir mon Menu
            </a>
            <button 
              onClick={handleLogout}
              className="text-sm px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 py-8">
        {error && <p role="alert" className="text-red-300 rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6">{error}</p>}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-8 flex items-start gap-4">
          <div className="text-2xl">👋</div>
          <div>
            <h2 className="text-lg font-bold text-orange-400 mb-1">Bienvenue dans votre tableau de bord !</h2>
            <p className="text-sm text-gray-300">Modifiez directement les prix ou cachez des plats s'ils ne sont plus disponibles. Les changements sont appliqués instantanément sur votre QR Code.</p>
          </div>
        </div>

        {restaurant.slug && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-2">Votre QR code</h2>
            <p className="text-sm text-gray-300 mb-5">Téléchargez-le à tout moment pour vos tables ou partagez le lien de votre menu.</p>
            <MenuQRCode slug={restaurant.slug} name={restaurant.name} />
          </section>
        )}

        {restaurant.menus && restaurant.menus[0] && restaurant.menus[0].categories.map((cat: any) => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-xl font-bold border-b border-white/10 pb-2 mb-4 text-orange-300">{cat.name}</h3>
            
            <div className="space-y-3">
              {cat.items.map((item: any) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    {item.description && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{item.description}</p>}
                  </div>
                  
                  {editingItem === item.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Prix (MAD)</label>
                        <input 
                          type="number"
                          className="w-24 bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-white"
                          value={editForm.price}
                          onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Dispo.</label>
                        <select 
                          className="bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-white"
                          value={editForm.is_available ? "1" : "0"}
                          onChange={e => setEditForm({...editForm, is_available: e.target.value === "1"})}
                        >
                          <option value="1">Oui</option>
                          <option value="0">Non</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => saveItem(item.id)}
                        className="mt-5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg"
                      >
                        Sauver
                      </button>
                      <button 
                        onClick={() => setEditingItem(null)}
                        className="mt-5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-black text-xl text-orange-400">{item.price} MAD</div>
                        {item.is_available ? (
                          <span className="text-xs text-green-400 font-semibold">Disponible</span>
                        ) : (
                          <span className="text-xs text-red-400 font-semibold">Rupture de stock</span>
                        )}
                      </div>
                      <button 
                        onClick={() => startEditing(item)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
                        title="Éditer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
