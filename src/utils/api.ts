export const API_BASE = (import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1')).replace(/\/$/, '');

export async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((entry: { msg?: string }) => entry.msg || fallback).join(', ');
    }
  } catch {
    // A proxy or unavailable server may return HTML instead of JSON.
  }
  return fallback;
}
