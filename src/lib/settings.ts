import { useEffect, useState } from 'react';
import { sbRest } from './supabase';

export interface SiteSettings {
  id: number;
  whatsapp_number: string;
  telegram_link: string | null;
  banner_text: string;
  instagram_link: string | null;
  facebook_link: string | null;
  business_hours: string | null;
  maintenance_mode: boolean;
  updated_at: string;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const rows = await sbRest<SiteSettings[]>('site_settings?id=eq.1&select=*');
  return rows[0];
}

export async function updateSiteSettings(
  input: Partial<
    Pick<
      SiteSettings,
      | 'whatsapp_number'
      | 'telegram_link'
      | 'banner_text'
      | 'instagram_link'
      | 'facebook_link'
      | 'business_hours'
      | 'maintenance_mode'
    >
  >
): Promise<void> {
  await sbRest('site_settings?id=eq.1', { method: 'PATCH', useAuth: true, body: input });
}

// =========================================================================
// HOOK: useSiteSettings — para usar la config (número de WhatsApp, etc.)
// desde cualquier componente de la tienda, sin repetir el fetch.
// =========================================================================

// Número real como respaldo, por si todavía no cargó la configuración
// desde Supabase (o falla la conexión) — así el botón de WhatsApp nunca
// queda roto.
const FALLBACK_WHATSAPP = '573008165725';

let cachedSettings: SiteSettings | null = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    fetchSiteSettings()
      .then((s) => {
        cachedSettings = s;
        setSettings(s);
      })
      .catch(() => {
        // si falla, seguimos con el número de respaldo
      });
  }, []);

  return {
    whatsappNumber: settings?.whatsapp_number || FALLBACK_WHATSAPP,
    telegramLink: settings?.telegram_link || null,
    bannerText: settings?.banner_text || 'Envío gratis a toda Colombia',
    maintenanceMode: settings?.maintenance_mode || false,
    settingsLoaded: settings !== null,
  };
}
