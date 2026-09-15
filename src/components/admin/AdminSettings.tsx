import { useEffect, useState, FormEvent } from 'react';
import { Save, CheckCircle2, Truck } from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings, SiteSettings } from '../../lib/settings';
import { validateColombianWhatsappNumber, validateHttpsUrl, validateRequiredText } from '../../lib/validation';

// Campos validados de este formulario (mismo patrón de errors/touched que
// ya usa CheckoutModal.tsx: no se muestra el error hasta que el usuario
// toca el campo o intenta guardar).
type FieldName = 'whatsapp' | 'telegram' | 'banner' | 'instagram' | 'facebook';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [banner, setBanner] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        setSettings(s);
        setWhatsapp(s.whatsapp_number);
        setTelegram(s.telegram_link || '');
        setBanner(s.banner_text);
        setInstagram(s.instagram_link || '');
        setFacebook(s.facebook_link || '');
        setBusinessHours(s.business_hours || '');
        setMaintenanceMode(s.maintenance_mode || false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const validateField = (name: FieldName, value: string): string => {
    switch (name) {
      case 'whatsapp':
        return validateColombianWhatsappNumber(value);
      case 'telegram':
        return validateHttpsUrl(value);
      case 'banner':
        return validateRequiredText(value, 'El texto del banner');
      case 'instagram':
        return validateHttpsUrl(value);
      case 'facebook':
        return validateHttpsUrl(value);
      default:
        return '';
    }
  };

  const handleFieldChange = (name: FieldName, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name: FieldName, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validamos los campos antes de intentar guardar en vez de dejar que
    // Supabase rechace (o guarde) datos inválidos silenciosamente.
    const values: Record<FieldName, string> = { whatsapp, telegram, banner, instagram, facebook };
    const fieldsToValidate: FieldName[] = ['whatsapp', 'telegram', 'banner', 'instagram', 'facebook'];

    const newErrors: Partial<Record<FieldName, string>> = {};
    fieldsToValidate.forEach((field) => {
      const fieldError = validateField(field, values[field]);
      if (fieldError) newErrors[field] = fieldError;
    });

    const newTouched: Partial<Record<FieldName, boolean>> = {};
    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = fieldsToValidate.find((field) => newErrors[field]);
      if (firstErrorField) {
        const inputElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
        inputElement?.focus();
      }
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await updateSiteSettings({
        whatsapp_number: whatsapp.trim(),
        telegram_link: telegram.trim() || null,
        banner_text: banner.trim(),
        instagram_link: instagram.trim() || null,
        facebook_link: facebook.trim() || null,
        business_hours: businessHours.trim() || null,
        maintenance_mode: maintenanceMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">Cargando configuración...</div>;
  if (!settings) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-1">Configuración del sitio</h1>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
        Estos datos se usan en toda la tienda (botones de WhatsApp, banner, etc.) — cambiarlos acá los actualiza en
        todo el sitio al instante, sin tocar código.
      </p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-xs p-6 space-y-5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Número de WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            name="whatsapp"
            value={whatsapp}
            onChange={(e) => handleFieldChange('whatsapp', e.target.value, setWhatsapp)}
            onBlur={(e) => handleBlur('whatsapp', e.target.value)}
            placeholder="573001234567"
            className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all dark:text-white ${
              errors.whatsapp && touched.whatsapp
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
            }`}
          />
          {errors.whatsapp && touched.whatsapp ? (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {errors.whatsapp}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Código de país + número, sin espacios ni el símbolo +.</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Link del canal de Telegram (opcional)
          </label>
          <input
            name="telegram"
            value={telegram}
            onChange={(e) => handleFieldChange('telegram', e.target.value, setTelegram)}
            onBlur={(e) => handleBlur('telegram', e.target.value)}
            placeholder="https://t.me/tucanal"
            className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all dark:text-white ${
              errors.telegram && touched.telegram
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
            }`}
          />
          {errors.telegram && touched.telegram && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {errors.telegram}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Texto del banner (envío, promo, etc.) <span className="text-red-500">*</span>
          </label>
          <input
            name="banner"
            value={banner}
            onChange={(e) => handleFieldChange('banner', e.target.value, setBanner)}
            onBlur={(e) => handleBlur('banner', e.target.value)}
            placeholder="Envío gratis a toda Colombia"
            className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all dark:text-white ${
              errors.banner && touched.banner
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
            }`}
          />
          {errors.banner && touched.banner && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {errors.banner}
            </p>
          )}

          {/* Vista previa en vivo: misma pastilla del Hero público (ícono de
              camión + texto en mayúsculas + bandera de Colombia), sobre un
              fondo oscuro para que se vea igual que en el sitio real. */}
          <div className="mt-3 bg-slate-950 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Vista previa</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-semibold tracking-wider uppercase">
              <Truck className="w-3.5 h-3.5" />
              <span>{(banner || 'Envío gratis a toda Colombia').toUpperCase()}</span>
              <span
                className="inline-flex flex-col w-5 h-3.5 rounded-xs overflow-hidden shadow-xs border border-brand-sky/20 shrink-0 select-none"
                title="Colombia"
              >
                <span className="bg-[#FCD116] h-1/2 w-full" />
                <span className="bg-[#003893] h-1/4 w-full" />
                <span className="bg-[#CE1126] h-1/4 w-full" />
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Instagram (opcional)
          </label>
          <input
            name="instagram"
            value={instagram}
            onChange={(e) => handleFieldChange('instagram', e.target.value, setInstagram)}
            onBlur={(e) => handleBlur('instagram', e.target.value)}
            placeholder="https://instagram.com/tutienda"
            className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all dark:text-white ${
              errors.instagram && touched.instagram
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
            }`}
          />
          {errors.instagram && touched.instagram && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {errors.instagram}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Facebook (opcional)
          </label>
          <input
            name="facebook"
            value={facebook}
            onChange={(e) => handleFieldChange('facebook', e.target.value, setFacebook)}
            onBlur={(e) => handleBlur('facebook', e.target.value)}
            placeholder="https://facebook.com/tutienda"
            className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all dark:text-white ${
              errors.facebook && touched.facebook
                ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
            }`}
          />
          {errors.facebook && touched.facebook && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {errors.facebook}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Horario de atención (opcional)
          </label>
          <input
            name="businessHours"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="Lunes a sábado, 9am a 6pm"
            className="w-full text-sm px-4 py-3 border border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60 dark:text-white outline-none rounded-2xl transition-all"
          />
        </div>

        <div className="flex items-start gap-3 bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3.5">
          <button
            type="button"
            role="switch"
            aria-checked={maintenanceMode}
            onClick={() => setMaintenanceMode((v) => !v)}
            className={`relative shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${
              maintenanceMode ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                maintenanceMode ? 'translate-x-4' : ''
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Modo mantenimiento</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Muestra un mensaje de "Volvemos pronto" en vez del catálogo en la tienda pública. El panel de
              administración sigue funcionando normal para que puedas desactivarlo.
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-3 py-2.5">{error}</p>}

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
