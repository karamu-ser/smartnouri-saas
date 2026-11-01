import { useRef, useState } from 'react';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getMenuUrl } from '../utils/menuUrl';

interface MenuQRCodeProps {
  slug: string;
  name?: string;
  tone?: 'dark' | 'light';
}

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function MenuQRCode({ slug, name, tone = 'dark' }: MenuQRCodeProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const menuUrl = getMenuUrl(slug);
  const light = tone === 'light';
  const secondaryText = light ? 'text-gray-600' : 'text-gray-300';
  const buttonStyle = `flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${light ? 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100' : 'border-white/15 bg-white/5 text-white hover:bg-white/10'}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setFeedback({ text: 'Lien du menu copié.', error: false });
    } catch {
      setFeedback({ text: 'Copie indisponible. Sélectionnez le lien ci-dessus pour le copier.', error: true });
    }
  };

  const downloadQR = async (format: 'png' | 'svg') => {
    if (!qrRef.current) return;
    setExporting(true);
    setFeedback(null);

    try {
      const svg = qrRef.current.cloneNode(true) as SVGSVGElement;
      // Whole pixels per module keep the printed PNG sharp, including its white margin.
      const modules = qrRef.current.viewBox.baseVal.width;
      const pixels = Math.ceil(1600 / modules) * modules;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', String(pixels));
      svg.setAttribute('height', String(pixels));
      svg.removeAttribute('style');
      svg.removeAttribute('class');
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const filename = `QR_${slug.replace(/[^a-zA-Z0-9_-]/g, '-') || 'menu'}`;

      if (format === 'svg') {
        saveFile(svgBlob, `${filename}.svg`);
      } else {
        // The site's CSP permits data images; blob images may be blocked by hosting headers.
        const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('QR image could not be loaded'));
          img.src = imageUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = pixels;
        canvas.height = pixels;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, pixels, pixels);
        context.drawImage(img, 0, 0, pixels, pixels);
        const png = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
        });
        saveFile(png, `${filename}.png`);
      }
      setFeedback({ text: `Téléchargement ${format === 'png' ? 'PNG haute définition' : 'SVG pour impression'} lancé.`, error: false });
    } catch {
      setFeedback({ text: 'Le téléchargement a échoué. Réessayez ou copiez le lien du menu.', error: true });
    } finally {
      setExporting(false);
    }
  };

  if (!slug) {
    return <p className={`text-center text-sm ${secondaryText}`}>Le lien du menu n’est pas encore disponible.</p>;
  }

  return (
    <div className="w-full min-w-0 space-y-5 text-center">
      <div className="mx-auto w-full max-w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <QRCodeSVG
          ref={qrRef}
          value={menuUrl}
          size={288}
          level="M"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
          title={`Scanner pour ouvrir le menu${name ? ` de ${name}` : ''}`}
          role="img"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
      <p className={`text-sm ${secondaryText}`}>Scannez avec l’appareil photo de votre téléphone pour ouvrir le menu.</p>
      <a href={menuUrl} target="_blank" rel="noopener noreferrer" className={`block break-all text-sm underline underline-offset-4 ${light ? 'text-blue-700' : 'text-blue-300'}`}>
        {menuUrl}
      </a>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a href={menuUrl} target="_blank" rel="noopener noreferrer" className={buttonStyle}>
          <ExternalLink size={16} aria-hidden="true" /> Voir le menu
        </a>
        <button type="button" onClick={copyLink} className={buttonStyle}>
          <Copy size={16} aria-hidden="true" /> Copier le lien
        </button>
        <button type="button" onClick={() => downloadQR('png')} disabled={exporting} className={buttonStyle}>
          <Download size={16} aria-hidden="true" /> Télécharger PNG HD
        </button>
        <button type="button" onClick={() => downloadQR('svg')} disabled={exporting} className={buttonStyle}>
          <Download size={16} aria-hidden="true" /> Télécharger SVG
        </button>
      </div>
      <p className={`text-xs ${secondaryText}`}>Pour vos tables et affiches : PNG haute définition ou SVG, net à toute taille.</p>
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`text-sm ${feedback.error ? (light ? 'text-red-700' : 'text-red-300') : (light ? 'text-green-700' : 'text-green-300')}`}>{feedback.text}</p>}
    </div>
  );
}
