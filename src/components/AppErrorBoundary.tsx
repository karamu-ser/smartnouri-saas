import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SmartNouri could not display this page.', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main lang="fr" className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16 text-white">
        <section
          role="alert"
          aria-labelledby="page-error-title"
          className="w-full max-w-lg rounded-3xl border border-white/10 bg-charcoal-light p-8 shadow-2xl sm:p-10"
        >
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-300">SmartNouri</p>
          <h1 id="page-error-title" className="text-2xl font-semibold tracking-tight">La page a rencontré un problème.</h1>
          <p className="mt-4 leading-relaxed text-gray-400">Rechargez la page pour réessayer, ou retrouvez-nous sur l’accueil.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Recharger
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Retour à l’accueil
            </a>
          </div>
        </section>
      </main>
    );
  }
}
