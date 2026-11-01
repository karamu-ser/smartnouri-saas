const rawPhone = (import.meta.env.VITE_WHATSAPP_PHONE || '').replace(/[^0-9]/g, '');
export const WHATSAPP_PHONE = rawPhone;
export const WHATSAPP_URL = WHATSAPP_PHONE ? `https://wa.me/${WHATSAPP_PHONE}` : 'https://wa.me/';
