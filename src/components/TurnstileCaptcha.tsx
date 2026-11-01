import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';
const TEST_SITE_KEY = '1x00000000000000000000AA';

interface TurnstileCaptchaProps {
  resetKey: number;
  onToken: (token: string) => void;
}

export default function TurnstileCaptcha({ resetKey, onToken }: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetKey = useRef(resetKey);
  const [loadError, setLoadError] = useState(false);
  const configuredKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
  const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const siteKey = configuredKey || (localHost ? TEST_SITE_KEY : '');

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        size: 'flexible',
        language: 'fr',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('');
          setLoadError(true);
        },
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      render();
    } else if (existing) {
      existing.addEventListener('load', render, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      script.addEventListener('error', () => setLoadError(true), { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken, siteKey]);

  useEffect(() => {
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    onToken('');
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  }, [resetKey, onToken]);

  if (!siteKey) {
    return <p role="alert" className="text-sm text-red-300">Le contrôle anti-robot n’est pas configuré.</p>;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px] w-full" aria-label="Contrôle anti-robot" />
      {loadError && <p role="alert" className="text-sm text-red-300">Le contrôle anti-robot n’a pas pu charger. Actualisez la page.</p>}
    </div>
  );
}
