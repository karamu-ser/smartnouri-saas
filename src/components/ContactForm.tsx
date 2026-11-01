import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/useLanguage';
import MenuQRCode from './MenuQRCode';
import ClientAccessCard, { type ClientAccess } from './ClientAccessCard';
import { API_BASE, responseError } from '../utils/api';
import TurnstileCaptcha from './TurnstileCaptcha';

const ContactForm = () => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [access, setAccess] = useState<ClientAccess | null>(null);
  const [menuReady, setMenuReady] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitting = useRef(false);

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
  };

  useEffect(() => stopProgress, []);
  
  const [formData, setFormData] = useState({
    establishment: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    type: '',
    menuFiles: [] as File[],
    message: ''
  });

  const startProgress = (start: number, end: number) => {
    stopProgress();
    setProgress(start);
    let current = start;
    progressTimer.current = setInterval(() => {
      current = Math.min(current + 1, end);
      setProgress(current);
      if (current === end) stopProgress();
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    setError('');
    if (formData.menuFiles.length === 0) {
      setError('Sélectionnez au moins une photo de votre menu (JPEG, PNG ou WebP).');
      return;
    }
    if (!access && !captchaToken) {
      setError('Validez le contrôle anti-robot avant de continuer.');
      return;
    }

    submitting.current = true;
    setIsGenerating(true);
    let createdAccess = access;
    try {
      if (!createdAccess) {
        setProgressLabel('Création de votre espace...');
        startProgress(0, 20);
        const response = await fetch(`${API_BASE}/restaurants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.establishment,
            contact_phone: formData.phone,
            contact_email: formData.email.trim() || null,
            theme: formData.type || 'cafe',
            captcha_token: captchaToken,
          }),
        });
        if (!response.ok) throw new Error(await responseError(response, 'Impossible de créer votre espace.'));
        const data = await response.json();
        createdAccess = { ...data, client_identifier: data.client_identifier || data.slug };
        // Retain the one-time credentials even if the subsequent upload fails.
        setAccess(createdAccess);
      }
      if (!createdAccess) throw new Error('Les accès à votre espace sont indisponibles.');

      setProgressLabel("Analyse de votre menu...");
      startProgress(25, 95);
      const uploadData = new FormData();
      formData.menuFiles.forEach(file => uploadData.append('files', file));
      const uploadResponse = await fetch(`${API_BASE}/restaurants/${createdAccess.id}/menu/upload`, {
        method: 'POST',
        body: uploadData,
      });
      if (!uploadResponse.ok) throw new Error(await responseError(uploadResponse, "L’analyse a échoué. Réessayez avec des photos plus lisibles."));
      const menu = await uploadResponse.json();
      if (!menu.categories?.some((category: { items?: unknown[] }) => category.items?.length)) {
        throw new Error("Aucun plat n’a pu être lu. Réessayez avec des photos plus lisibles.");
      }
      setMenuReady(true);
      setProgress(100);
      setSubmitted(true);
    } catch (error) {
      setError(error instanceof Error && !(error instanceof TypeError) ? error.message : 'Erreur de connexion. Veuillez réessayer.');
      if (!createdAccess) {
        setCaptchaToken('');
        setCaptchaResetKey(key => key + 1);
      }
      // A retry only uploads images to the existing account; it never creates another one.
      if (createdAccess) setSubmitted(true);
    } finally {
      stopProgress();
      submitting.current = false;
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (files.length > 10 || files.some(file => !validTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Ajoutez au maximum 10 photos JPEG, PNG ou WebP de 5 Mo chacune.');
      e.target.value = '';
      return;
    }
    setError('');
    setFileName(files.length === 1 ? files[0].name : `${files.length} fichiers sélectionnés`);
    setFormData({ ...formData, menuFiles: files });
  };

  return (
    <section id="contact" className="section-padding bg-charcoal-light">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">{t('contact_title')}</h2>
          <p className="text-text-secondary text-lg">{t('contact_subtitle')}</p>
        </div>

        <div className="surface-card rounded-3xl p-5 sm:p-8 md:p-12 border border-white/[0.06] max-w-2xl mx-auto mt-12 relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative flex flex-col items-center justify-center py-6 text-center rounded-3xl min-h-[350px]"
              >
                {/* Animated progress ring */}
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle 
                      cx="60" cy="60" r="52" fill="none" 
                      stroke="url(#progressGradient)" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{progress}%</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{progressLabel}</h3>
                <p className="text-gray-500 text-sm">Veuillez patienter...</p>
                
                {/* Progress bar */}
                <div className="w-full max-w-xs mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {access && (
                  <div className="w-full mt-8">
                    <ClientAccessCard access={access} canOpen={false} />
                  </div>
                )}
              </motion.div>
            ) : submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative flex flex-col items-center justify-center py-6 text-center rounded-3xl min-h-[350px]"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  {menuReady ? 'Votre menu est prêt !' : 'Votre espace est créé'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {menuReady ? 'Votre QR code est prêt à être partagé ou imprimé.' : 'Enregistrez vos accès, puis relancez l’analyse de votre menu.'}
                </p>
                {!menuReady && (
                  <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 text-left space-y-4">
                    <p role="alert" className="text-amber-200 text-sm">{error}</p>
                    <label htmlFor="menu-retry" className="block text-sm text-gray-200">Changer les photos du menu (facultatif)</label>
                    <input id="menu-retry" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="block w-full min-w-0 text-sm text-gray-300" />
                    <p className="text-xs text-gray-300 break-all">{fileName}</p>
                    <button type="submit" className="btn-primary w-full">Réessayer l’analyse</button>
                  </form>
                )}
                {menuReady && access && (
                  <div className="w-full mb-6">
                    <MenuQRCode slug={access.slug} name={formData.establishment} />
                  </div>
                )}
                {access && <ClientAccessCard access={access} />}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && <p role="alert" className="text-red-300 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={t('contact_establishment')} 
                      required 
                      value={formData.establishment}
                      onChange={(e) => setFormData({...formData, establishment: e.target.value})}
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={t('contact_name')} 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder={`${t('contact_email')} (facultatif)`}
                      aria-label={`${t('contact_email')} (facultatif)`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-orange-500">
                      <span className="flex items-center border-r border-white/10 px-3 text-white font-semibold">+212</span>
                      <input
                      type="tel" 
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
                      placeholder="6 12 34 56 78"
                      aria-label="Numéro de téléphone marocain"
                      required 
                      inputMode="numeric"
                      autoComplete="tel-national"
                      pattern="[5-7][0-9]{8}"
                      title="9 chiffres, commençant par 5, 6 ou 7"
                      maxLength={9}
                      value={formData.phone.replace(/^\+212/, '')}
                      onChange={(e) => {
                        const localNumber = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setFormData({...formData, phone: localNumber ? `+212${localNumber}` : ''});
                      }}
                    />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Numéro marocain unique, 9 chiffres après +212.</p>
                  </div>
                </div>

                <p className="text-sm text-gray-300">Aucun email nécessaire : vos accès seront affichés ici après la création. Photos JPEG, PNG ou WebP, 5 Mo maximum par photo.</p>

                <div>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={t('contact_city')} 
                    required 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>

                <div>
                  <select 
                    className="input-field w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="" disabled className="bg-charcoal text-white">{t('contact_type')}</option>
                    <option value="cafe" className="bg-charcoal text-white">{t('contact_type_cafe')}</option>
                    <option value="restaurant" className="bg-charcoal text-white">{t('contact_type_restaurant')}</option>
                    <option value="hotel" className="bg-charcoal text-white">{t('contact_type_hotel')}</option>
                    <option value="other" className="bg-charcoal text-white">{t('contact_type_other')}</option>
                  </select>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    id="menu-upload"
                    className="hidden" 
                    multiple
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <label 
                    htmlFor="menu-upload" 
                    className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-white/10 hover:border-accent-purple/50 rounded-xl cursor-pointer transition-colors bg-white/[0.02]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-white text-sm">
                        {fileName || t('contact_upload')}
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <textarea 
                    className="input-field w-full resize-none h-32" 
                    placeholder={t('contact_message')}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                <TurnstileCaptcha resetKey={captchaResetKey} onToken={setCaptchaToken} />

                <button type="submit" disabled={!captchaToken} className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50">
                  {t('contact_submit')}
                </button>
                
                <p className="text-center text-sm text-text-secondary mt-4">
                  {t('contact_trust')}
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
