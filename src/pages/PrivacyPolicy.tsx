import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="bg-charcoal text-white min-h-screen font-sans selection:bg-accent-purple/30 selection:text-white">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8">Politique de Confidentialité</h1>
          
          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Informations collectées</h2>
              <p>
                Dans le cadre de l'utilisation de nos services (Smart Nouri), nous collectons les informations suivantes via notre formulaire de contact :
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Nom de l'établissement</li>
                <li>Nom du contact</li>
                <li>Numéro de téléphone / WhatsApp</li>
                <li>Ville et type d'établissement</li>
                <li>Fichiers de menu (images, PDF) fournis volontairement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Utilisation des données</h2>
              <p>
                Ces informations sont utilisées <strong>exclusivement</strong> dans le but de :
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Créer et configurer votre menu digital personnalisé.</li>
                <li>Vous contacter (via WhatsApp ou téléphone) pour vous présenter l'aperçu de votre menu.</li>
                <li>Gérer votre compte et votre facturation (si vous validez la prestation).</li>
              </ul>
              <p className="mt-2 text-accent-purple">
                Nous ne revendons, ni ne louons vos données personnelles à des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Stockage et sécurité</h2>
              <p>
                Vos données sont stockées de manière sécurisée sur nos serveurs. Nous utilisons des mesures de sécurité conformes aux standards de l'industrie (chiffrement, en-têtes de sécurité, CSP) pour protéger vos informations contre tout accès non autorisé. Cloudflare Turnstile traite les signaux nécessaires au contrôle anti-robot lors de la création d’un menu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
              <p>
                Notre site vitrine utilise le strict minimum en termes de stockage local (ex: conservation du choix de langue). Nous n'utilisons pas de cookies de traçage publicitaire invasifs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Vos droits (RGPD)</h2>
              <p>
                Conformément aux réglementations sur la protection des données, vous disposez d'un droit d'accès, de rectification, de modification et de suppression de vos données. Pour exercer ce droit, il vous suffit de nous contacter via WhatsApp au numéro indiqué sur le site.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
