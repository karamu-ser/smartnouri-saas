import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import HowItWorks from '../components/HowItWorks';
import InteractiveDemo from '../components/InteractiveDemo';
import Features from '../components/Features';
import Themes from '../components/Themes';
import Pricing from '../components/Pricing';
import ContactForm from '../components/ContactForm';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main className="overflow-x-hidden w-full">
        <Hero />
        <Problem />
        <HowItWorks />
        <InteractiveDemo />
        <Features />
        <Themes />
        <Pricing />
        <ContactForm />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
