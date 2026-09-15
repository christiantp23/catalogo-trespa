import { useEffect, useState, ChangeEvent } from 'react';
import { Plus, Trash2, Upload, Loader2, ChevronUp, ChevronDown, Video, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import {
  DbTestimonial,
  fetchAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../../lib/testimonials';
import { uploadProductImage, UploadPhase } from '../../lib/supabase';
import { validateRequiredText } from '../../lib/validation';

const PHASE_LABEL: Record<UploadPhase, string> = {
  optimizing: 'Optimizando imagen...',
  uploading: 'Subiendo...',
};

// Campos validados del formulario "Agregar testimonio" — mismo patrón de
// errors/touched que CheckoutModal.tsx: el error no se muestra hasta que
// el usuario toca el campo o intenta guardar.
type NewTestimonialField = 'name' | 'media';

const PHONE_COLORS = [
  { value: 'bg-amber-400', label: 'Amarillo' },
  { value: 'bg-emerald-500', label: 'Verde' },
  { value: 'bg-rose-500', label: 'Rojo' },
  { value: 'bg-sky-500', label: 'Azul' },
  { value: 'bg-violet-500', label: 'Violeta' },
];

const DEFAULT_CUSTOM_COLOR = '#F59E0B';

// phone_color se guarda como clase de Tailwind (ej. 'bg-amber-400') o, para
// la opción "Personalizado", como código hexadecimal (ej. '#F59E0B'). Un
// valor que empieza con '#' es hex; cualquier otra cosa se trata como clase.
const isHexColor = (value: string) => value.startsWith('#');

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<DbTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | 'new' | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PHONE_COLORS[0].value);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newIsVideo, setNewIsVideo] = useState(false);

  const [newErrors, setNewErrors] = useState<Partial<Record<NewTestimonialField, string>>>({});
  const [newTouched, setNewTouched] = useState<Partial<Record<NewTestimonialField, boolean>>>({});

  const validateNewName = (value: string): string => validateRequiredText(value, 'El nombre del cliente');
  const validateNewMedia = (mediaUrl: string): string => (mediaUrl ? '' : 'Subí una foto o video antes de guardar');

  const handleNewNameChange = (value: string) => {
    setNewName(value);
    if (newTouched.name) {
      setNewErrors((prev) => ({ ...prev, name: validateNewName(value) }));
    }
  };

  const handleNewNameBlur = () => {
    setNewTouched((prev) => ({ ...prev, name: true }));
    setNewErrors((prev) => ({ ...prev, name: validateNewName(newName) }));
  };

  const load = async () => {
    setLoading(true);
    try {
      setTestimonials(await fetchAdminTestimonials());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNewFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId('new');
    setError(null);
    try {
      const url = await uploadProductImage(file, setUploadPhase);
      setNewMediaUrl(url);
      setNewIsVideo(file.type.startsWith('video/'));
      if (newTouched.media) {
        setNewErrors((prev) => ({ ...prev, media: validateNewMedia(url) }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploadingId(null);
      setUploadPhase(null);
      e.target.value = '';
    }
  };

  const handleAdd = async () => {
    // Validamos nombre y medio (foto/video) antes de intentar guardar, en
    // vez de dejar que se cree un testimonio vacío o a medias.
    const nameError = validateNewName(newName);
    const mediaError = validateNewMedia(newMediaUrl);
    setNewTouched({ name: true, media: true });
    setNewErrors({ name: nameError, media: mediaError });
    if (nameError || mediaError) return;

    try {
      await createTestimonial({
        client_name: newName.trim(),
        phone_color: newColor,
        chat_screenshot: newIsVideo ? null : newMediaUrl,
        video_url: newIsVideo ? newMediaUrl : null,
        is_video: newIsVideo,
        sort_order: testimonials.length + 1,
      });
      setNewName('');
      setNewMediaUrl('');
      setNewIsVideo(false);
      setNewErrors({});
      setNewTouched({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el testimonio');
    }
  };

  const handleReplaceMedia = async (t: DbTestimonial, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(t.id);
    setError(null);
    try {
      const url = await uploadProductImage(file, setUploadPhase);
      const isVideo = file.type.startsWith('video/');
      await updateTestimonial(t.id, {
        chat_screenshot: isVideo ? null : url,
        video_url: isVideo ? url : null,
        is_video: isVideo,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploadingId(null);
      setUploadPhase(null);
      e.target.value = '';
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = testimonials[index + direction];
    const current = testimonials[index];
    if (!target) return;
    const reordered = [...testimonials];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    setTestimonials(reordered);
    await Promise.all([
      updateTestimonial(current.id, { sort_order: target.sort_order }),
      updateTestimonial(target.id, { sort_order: current.sort_order }),
    ]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return;
    try {
      await deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert('No se pudo eliminar: ' + (err instanceof Error ? err.message : ''));
    }
  };

  if (loading) return <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">Cargando testimonios...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-1">Testimonios</h1>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
        Capturas de chat o videos de clientes reales que se muestran en la sección de testimonios de la tienda.
      </p>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-3 py-2.5 mb-4">{error}</p>
      )}

      <div className="space-y-3 mb-6">
        {testimonials.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                title="Mover arriba"
                disabled={i === 0}
                onClick={() => handleMove(i, -1)}
                className="text-slate-300 hover:text-brand-blue dark:text-slate-600 dark:hover:text-brand-sky disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                title="Mover abajo"
                disabled={i === testimonials.length - 1}
                onClick={() => handleMove(i, 1)}
                className="text-slate-300 hover:text-brand-blue dark:text-slate-600 dark:hover:text-brand-sky disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <label
              className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
              title={uploadingId === t.id ? (uploadPhase ? PHASE_LABEL[uploadPhase] : 'Subiendo...') : undefined}
            >
              {t.is_video ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Video className="w-4 h-4" />
                </div>
              ) : t.chat_screenshot ? (
                <img src={t.chat_screenshot} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                {uploadingId === t.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
                )}
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleReplaceMedia(t, e)}
                disabled={uploadingId === t.id}
                className="hidden"
              />
            </label>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{t.client_name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{t.is_video ? 'Video' : 'Captura de chat'}</p>
            </div>

            <span
              className={`w-3 h-3 rounded-full shrink-0 ${isHexColor(t.phone_color) ? '' : t.phone_color}`}
              style={isHexColor(t.phone_color) ? { backgroundColor: t.phone_color } : undefined}
              title="Color del mockup"
            />

            <button
              onClick={() => handleDelete(t.id)}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-600 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Agregar nuevo testimonio */}
      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Agregar testimonio</p>
        <div className="space-y-3">
          <div>
            <input
              name="name"
              value={newName}
              onChange={(e) => handleNewNameChange(e.target.value)}
              onBlur={handleNewNameBlur}
              placeholder="Nombre del cliente"
              className={`w-full text-sm px-4 py-2.5 border outline-none rounded-xl transition-all dark:text-white ${
                newErrors.name && newTouched.name
                  ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 bg-rose-50/10 dark:bg-rose-950/20'
                  : 'border-slate-100 dark:border-slate-700 focus:border-brand-blue bg-slate-50/60 dark:bg-slate-800/60'
              }`}
            />
            {newErrors.name && newTouched.name && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                {newErrors.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Color del mockup:</span>
            {PHONE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.value} ${
                  newColor === c.value ? 'ring-2 ring-offset-2 ring-brand-blue dark:ring-offset-slate-900' : ''
                }`}
                title={c.label}
              />
            ))}
            <button
              type="button"
              onClick={() => setNewColor(isHexColor(newColor) ? newColor : DEFAULT_CUSTOM_COLOR)}
              className={`w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 ${
                isHexColor(newColor) ? 'ring-2 ring-offset-2 ring-brand-blue dark:ring-offset-slate-900' : ''
              }`}
              style={{ backgroundColor: isHexColor(newColor) ? newColor : DEFAULT_CUSTOM_COLOR }}
              title="Personalizado"
            />
            {isHexColor(newColor) && (
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-0.5"
                title="Elegir color personalizado"
              />
            )}
          </div>

          <div>
            <label
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold cursor-pointer transition-colors ${
                newErrors.media && newTouched.media
                  ? 'border-rose-300 dark:border-rose-800 text-rose-500 dark:text-rose-400 hover:border-rose-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {uploadingId === 'new' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {uploadPhase ? PHASE_LABEL[uploadPhase] : 'Subiendo...'}
                </>
              ) : newMediaUrl ? (
                <>{newIsVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />} Archivo listo — tocá para cambiar</>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Subir captura de chat o video
                </>
              )}
              <input
                name="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleNewFileSelected}
                disabled={uploadingId === 'new'}
                className="hidden"
              />
            </label>
            {newErrors.media && newTouched.media && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                {newErrors.media}
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={uploadingId === 'new' || saved}
            className={`flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl text-white text-sm font-bold transition-colors disabled:opacity-100 ${
              saved ? 'bg-emerald-500' : 'bg-brand-blue hover:bg-slate-950 disabled:opacity-60'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> ¡Guardado!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Agregar testimonio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
