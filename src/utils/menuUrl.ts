export function getMenuUrl(slug: string): string {
  const configuredSite = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  let siteUrl = window.location.origin;

  if (configuredSite) {
    try {
      const parsed = new URL(configuredSite);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        siteUrl = `${parsed.origin}${parsed.pathname}`;
      }
    } catch {
      // Keep links usable on the current site if the configured URL is invalid.
    }
  }

  return `${siteUrl.replace(/\/+$/, '')}/menu/${encodeURIComponent(slug)}`;
}
