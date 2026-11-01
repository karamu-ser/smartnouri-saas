import { useRef, type PointerEvent } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Coffee,
  Globe2,
  ScanLine,
  Smartphone,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../i18n/useLanguage';

function MenuScene() {
  const { lang } = useLanguage();
  const sceneRef = useRef<HTMLDivElement>(null);
  const fr = lang === 'fr';

  const resetPerspective = () => {
    sceneRef.current?.style.setProperty('--scene-x', '0deg');
    sceneRef.current?.style.setProperty('--scene-y', '0deg');
  };

  const movePerspective = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    sceneRef.current?.style.setProperty(
      '--scene-x',
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * -7}deg`,
    );
    sceneRef.current?.style.setProperty(
      '--scene-y',
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 9}deg`,
    );
  };

  return (
    <div
      className="menu-scene"
      ref={sceneRef}
      onPointerMove={movePerspective}
      onPointerLeave={resetPerspective}
    >
      <div className="scene-halo" aria-hidden="true" />
      <div className="scene-orbit scene-orbit-one" aria-hidden="true" />
      <div className="scene-orbit scene-orbit-two" aria-hidden="true" />
      <div className="scene-floor" aria-hidden="true" />
      <div
        className="scene-objects"
        role="img"
        aria-label={fr
          ? 'Aperçu 3D du menu Café Nouri sur un téléphone, avec son QR code et ses mises à jour instantanées.'
          : '3D preview of the Café Nouri mobile menu, with its QR code and instant updates.'}
      >
        <div className="scene-spark scene-spark-one" aria-hidden="true">
          <Sparkles size={24} />
        </div>
        <div className="scene-spark scene-spark-two" aria-hidden="true">
          <ScanLine size={22} />
        </div>
        <div className="menu-phone" aria-hidden="true">
          <div className="phone-side-button" />
          <div className="phone-screen">
            <div className="phone-status">
              <span>9:41</span>
              <span className="phone-island" />
              <Wifi size={13} />
              <span className="phone-battery" />
            </div>
            <div className="phone-brand">
              <span className="phone-brand-icon">
                <Coffee size={19} />
              </span>
              <span>
                café nouri
                <span className="phone-brand-caption">COFFEE & GOOD MOMENTS</span>
              </span>
              <span className="phone-lang">{fr ? 'FR' : 'EN'}</span>
            </div>
            <div className="phone-welcome">
              <span>{fr ? 'FAITES COMME CHEZ VOUS' : 'MAKE YOURSELF AT HOME'}</span>
              <h3>
                {fr ? 'Le goût des' : 'A taste of'}
                <br />
                <em>{fr ? 'petits bonheurs.' : 'simple pleasures.'}</em>
              </h3>
            </div>
            <div className="coffee-art">
              <div className="coffee-shadow" />
              <div className="coffee-saucer">
                <div className="coffee-handle" />
                <div className="coffee-cup">
                  <div className="coffee-foam" />
                </div>
              </div>
              <span className="coffee-tag">
                {fr ? 'Notre signature' : 'Our signature'} <Sparkles size={10} />
              </span>
            </div>
            <div className="phone-tabs">
              <span className="selected">{fr ? 'Les cafés' : 'Coffee'}</span>
              <span>{fr ? 'Les douceurs' : 'Sweet treats'}</span>
              <span>{fr ? 'Les thés' : 'Tea'}</span>
            </div>
            <div className="phone-menu-item">
              <div>
                <strong>Cappuccino</strong>
                <small>{fr ? 'Espresso, lait & douceur' : 'Espresso, milk & a little joy'}</small>
              </div>
              <b>18 <small>DH</small></b>
            </div>
            <div className="phone-menu-item">
              <div>
                <strong>Espresso</strong>
                <small>{fr ? 'Intense, tout simplement' : 'Simply intense'}</small>
              </div>
              <b>14 <small>DH</small></b>
            </div>
            <div className="phone-powered">
              <span className="status-dot" /> {fr ? 'Votre menu, toujours à jour' : 'Your menu, always up to date'}
            </div>
            <div className="phone-home-indicator" />
          </div>
        </div>
        <div className="scene-qr-card" aria-hidden="true">
          <div className="qr-card-heading">
            <ScanLine size={15} />
            <span>SCAN & ENJOY</span>
            <ArrowUpRight size={14} />
          </div>
          <div className="qr-card-code">
            <QRCodeSVG
              value={`${window.location.origin}/#demo`}
              size={112}
              fgColor="#242033"
              bgColor="#ffffff"
              marginSize={1}
            />
          </div>
          <strong>{fr ? 'Un scan. Tout le menu.' : 'One scan. The whole menu.'}</strong>
          <span className="qr-card-footer">SMART NOURI <span>↗</span></span>
        </div>
        <div className="scene-update-card" aria-hidden="true">
          <span className="update-check">
            <Check size={19} strokeWidth={3} />
          </span>
          <div>
            <strong>{fr ? 'Menu mis à jour' : 'Menu updated'}</strong>
            <span>{fr ? 'Instantanément. Partout.' : 'Instantly. Everywhere.'}</span>
          </div>
          <span className="update-dot" />
        </div>
        <div className="scene-caption" aria-hidden="true">
          <span className="status-dot" /> {fr ? 'UNE EXPÉRIENCE À LA HAUTEUR DE VOTRE CUISINE' : 'AN EXPERIENCE AS GOOD AS YOUR FOOD'}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t, lang } = useLanguage();
  const fr = lang === 'fr';

  return (
    <section id="accueil" className="hero-section">
      <div className="hero-grid" aria-hidden="true" />
      <div className="container-custom hero-layout">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="status-dot" />
            {fr ? 'LA NOUVELLE FAÇON DE PRÉSENTER VOTRE MENU' : 'A FRESH WAY TO SHARE YOUR MENU'}
          </div>
          <h1>
            {fr ? 'Votre menu.' : 'Your menu.'}
            <br />
            {fr ? 'Une nouvelle' : 'A whole new'}
            <br />
            <span className="gradient-text">dimension.</span>
          </h1>
          <p className="hero-description">{t('hero_subtitle')}</p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">
              <span>{t('hero_cta')}</span>
              <ArrowUpRight size={18} />
            </a>
            <a href="#demo" className="btn-secondary">
              <span className="demo-play">▶</span>
              {t('hero_demo')}
            </a>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={14} />
              {fr ? '100 % gratuit' : '100% free'}
            </span>
            <span>
              <Check size={14} />
              {fr ? 'Sans application' : 'No app needed'}
            </span>
            <span>
              <Check size={14} />
              {fr ? 'Sans engagement' : 'No commitment'}
            </span>
          </div>
          <div className="hero-local">
            <span className="morocco-mark">✳</span>
            <p>
              {fr ? 'Imaginé pour les bonnes tables.' : 'Made for great places.'}
              <span>{fr ? 'Pensé pour les établissements au Maroc.' : 'Designed for businesses in Morocco.'}</span>
            </p>
          </div>
        </div>
        <MenuScene />
      </div>
      <div className="container-custom hero-bottom">
        <a href="#comment-ca-marche" className="hero-scroll">
          <ArrowDown size={15} />
          <span>{fr ? 'DÉCOUVRIR SMART NOURI' : 'DISCOVER SMART NOURI'}</span>
        </a>
        <div className="hero-bottom-note">
          <Globe2 size={14} />
          {fr ? 'Du comptoir au smartphone.' : 'From your counter to their phone.'}
        </div>
      </div>
      <div className="hero-benefits">
        <div className="container-custom hero-benefits-inner">
          <div>
            <span className="benefit-icon">
              <ScanLine size={21} />
            </span>
            <p>
              <strong>{fr ? 'Un simple scan' : 'Just one scan'}</strong>
              <span>{fr ? 'Votre carte à portée de main' : 'Your menu at their fingertips'}</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Zap size={21} />
            </span>
            <p>
              <strong>{fr ? 'Toujours à jour' : 'Always up to date'}</strong>
              <span>{fr ? 'Un changement, partout à la fois' : 'One change, everywhere at once'}</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Smartphone size={21} />
            </span>
            <p>
              <strong>{fr ? 'Fait pour le mobile' : 'Made for mobile'}</strong>
              <span>{fr ? 'Aucune application à installer' : 'No app to download'}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
