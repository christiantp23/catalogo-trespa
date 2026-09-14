import { useEffect, useState, FormEvent } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings, SiteSettings } from '../../lib/settings';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [banner, setBanner] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        setSettings(s);
        setWhatsapp(s.whatsapp_number);
        setTelegram(s.telegram_link || '');
        setBanner(s.banner_text);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      await updateSiteSettings({
        whatsapp_number: whatsapp.trim(),
        telegram_link: telegram.trim() || null,
        banner_text: banner.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-sm text-slate-400">Cargando configuración...</div>;
  if (!settings) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-lg text-slate-900 mb-1">Configuración del sitio</h1>
      <p className="text-xs text-slate-400 mb-6">
        Estos datos se usan en toda la tienda (botones de WhatsApp, banner, etc.) — cambiarlos acá los actualiza en
        todo el sitio al instante, sin tocar código.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[28px] shadow-xs p-6 space-y-5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Número de WhatsApp
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="573001234567"
            className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl"
          />
          <p className="text-[11px] text-slate-400 mt-1">Código de país + número, sin espacios ni el símbolo +.</p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Link del canal de Telegram (opcional)
          </label>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="https://t.me/tucanal"
            className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Texto del banner (envío, promo, etc.)
          </label>
          <input
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="Envío gratis a toda Colombia"
            className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl"
          />
        </div>

        {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-sm font-bold transition-colors disabled:opacity-60"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
