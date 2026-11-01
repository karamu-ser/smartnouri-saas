import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, responseError } from '../utils/api';
import { safeStorage } from '../utils/storage';

export interface ClientAccess {
  id: number;
  slug: string;
  client_identifier: string;
  client_password: string;
  client_recovery_code: string;
}

export default function ClientAccessCard({ access, canOpen = true }: { access: ClientAccess; canOpen?: boolean }) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const downloadAccess = () => {
    const text = [
      'SMART NOURI — Vos accès privés',
      `Espace client : ${new URL('/client', window.location.origin).href}`,
      `Identifiant : ${access.client_identifier}`,
      `Mot de passe : ${access.client_password}`,
      `Code de récupération : ${access.client_recovery_code}`,
      '',
      'Conservez ce fichier en lieu sûr. Ne le partagez pas avec vos clients.',
      'Le code de récupération permet de changer votre mot de passe sans email.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `acces-prives-${access.slug}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  const openDashboard = async () => {
    setOpening(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: access.client_identifier, password: access.client_password }),
      });
      if (!response.ok) throw new Error(await responseError(response, 'Connexion impossible. Réessayez.'));
      const data = await response.json();
      safeStorage.setItem('clientToken', data.access_token);
      navigate('/client');
    } catch (error) {
      setError(error instanceof Error && !(error instanceof TypeError) ? error.message : 'Erreur de connexion. Réessayez.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-green-500/30 bg-green-500/10 p-4 sm:p-6 text-left">
      <h4 className="font-bold text-green-300 text-lg">Vos accès, sans email</h4>
      <p className="text-sm text-gray-300 mt-2">Enregistrez ces accès avant de quitter cette page. Votre mot de passe et votre code de récupération ne seront plus affichés ensuite.</p>
      <dl className="space-y-3 my-5 text-sm">
        {[
          ['Identifiant', access.client_identifier],
          ['Mot de passe', access.client_password],
          ['Code de récupération', access.client_recovery_code],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-gray-300 mb-1">{label}</dt>
            <dd className="bg-black/25 text-white rounded-lg p-3 font-mono break-all select-all">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-300 mb-4">Gardez ces accès privés. Seuls le lien du menu et le QR code sont destinés à vos clients.</p>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={downloadAccess} className="rounded-xl border border-green-500/40 px-4 py-3 text-white font-semibold hover:bg-green-500/10">
          Télécharger mes accès
        </button>
        {downloaded && <p role="status" className="text-sm text-green-300">Téléchargement lancé. Vérifiez que le fichier est enregistré.</p>}
        <button type="button" onClick={openDashboard} disabled={opening || !canOpen} className="btn-primary w-full disabled:opacity-50">
          {opening ? 'Connexion...' : 'Ouvrir mon espace client'}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-300 mt-3">{error}</p>}
    </div>
  );
}
