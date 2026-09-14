import { useEffect, useState, ChangeEvent } from 'react';
import { Plus, Trash2, Upload, Loader2, ChevronUp, ChevronDown, Video, Image as ImageIcon } from 'lucide-react';
import {
  DbTestimonial,
  fetchAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../../lib/testimonials';
import { uploadProductImage } from '../../lib/supabase';

const PHONE_COLORS = [
  { value: 'bg-amber-400', label: 'Amarillo' },
  { value: 'bg-emerald-500', label: 'Verde' },
  { value: 'bg-rose-500', label: 'Rojo' },
  { value: 'bg-sky-500', label: 'Azul' },
  { value: 'bg-violet-500', label: 'Violeta' },
];

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<DbTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PHONE_COLORS[0].value);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newIsVideo, setNewIsVideo] = useState(false);

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
      const url = await uploadProductImage(file);
      setNewMediaUrl(url);
      setNewIsVideo(file.type.startsWith('video/'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newMediaUrl) {
      setError('Poné un nombre y subí una captura o video.');
      return;
    }
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
      const url = await uploadProductImage(file);
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

  if (loading) return <div className="text-center py-16 text-sm text-slate-400">Cargando testimonios...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-lg text-slate-900 mb-1">Testimonios</h1>
      <p className="text-xs text-slate-400 mb-6">
        Capturas de chat o videos de clientes reales que se muestran en la sección de testimonios de la tienda.
      </p>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 mb-4">{error}</p>
      )}

      <div className="space-y-3 mb-6">
        {testimonials.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-xs">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                title="Mover arriba"
                disabled={i === 0}
                onClick={() => handleMove(i, -1)}
                className="text-slate-300 hover:text-brand-blue disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                title="Mover abajo"
                disabled={i === testimonials.length - 1}
                onClick={() => handleMove(i, 1)}
                className="text-slate-300 hover:text-brand-blue disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <label className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 cursor-pointer group">
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
              <p className="font-semibold text-sm text-slate-900 truncate">{t.client_name}</p>
              <p className="text-[11px] text-slate-400">{t.is_video ? 'Video' : 'Captura de chat'}</p>
            </div>

            <span className={`w-3 h-3 rounded-full ${t.phone_color} shrink-0`} title="Color del mockup" />

            <button
              onClick={() => handleDelete(t.id)}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Agregar nuevo testimonio */}
      <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Agregar testimonio</p>
        <div className="space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del cliente"
            className="w-full text-sm px-4 py-2.5 bg-slate-50/60 border border-slate-100 rounded-xl outline-none focus:border-brand-blue"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Color del mockup:</span>
            {PHONE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.value} ${
                  newColor === c.value ? 'ring-2 ring-offset-2 ring-brand-blue' : ''
                }`}
                title={c.label}
              />
            ))}
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold cursor-pointer hover:border-brand-blue hover:text-brand-blue transition-colors">
            {uploadingId === 'new' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
              </>
            ) : newMediaUrl ? (
              <>{newIsVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />} Archivo listo — tocá para cambiar</>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Subir captura de chat o video
              </>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleNewFileSelected}
              disabled={uploadingId === 'new'}
              className="hidden"
            />
          </label>

          <button
            onClick={handleAdd}
            disabled={uploadingId === 'new'}
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Agregar testimonio
          </button>
        </div>
      </div>
    </div>
  );
}
