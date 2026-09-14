import { useEffect, useState, ChangeEvent } from 'react';
import { X, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadProductImage } from '../../lib/supabase';
import {
  DbProduct,
  DbColorway,
  fetchAdminProducts,
  addColorway,
  updateColorway,
  deleteColorway,
  addSize,
  updateSize,
  deleteSize,
} from '../../lib/products';

interface ColorwayManagerProps {
  product: DbProduct;
  onClose: () => void;
  onChanged: () => void; // refresca la lista del dashboard al cerrar
}

export default function ColorwayManager({ product, onClose, onChanged }: ColorwayManagerProps) {
  const [colorways, setColorways] = useState<DbColorway[]>(product.colorways || []);
  const [newColorName, setNewColorName] = useState('');
  const [newColorImage, setNewColorImage] = useState('');
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingColorwayId, setUploadingColorwayId] = useState<string | null>(null);
  const [newSizeByColorway, setNewSizeByColorway] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Volvemos a traer los datos frescos del producto por si el modal quedó abierto un rato
  const refresh = async () => {
    const all = await fetchAdminProducts();
    const fresh = all.find((p) => p.id === product.id);
    if (fresh) setColorways(fresh.colorways || []);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    onChanged();
    onClose();
  };

  const handleNewColorImageSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingNew(true);
    try {
      const url = await uploadProductImage(file);
      setNewColorImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setUploadingNew(false);
      e.target.value = '';
    }
  };

  const handleReplaceColorwayImage = async (colorwayId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingColorwayId(colorwayId);
    try {
      const url = await uploadProductImage(file);
      await updateColorway(colorwayId, { image_url: url });
      setColorways((prev) => prev.map((c) => (c.id === colorwayId ? { ...c, image_url: url } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setUploadingColorwayId(null);
      e.target.value = '';
    }
  };

  const handleAddColorway = async () => {
    if (!newColorName.trim()) return;
    setBusy(true);
    try {
      await addColorway(product.id, newColorName.trim(), newColorImage.trim());
      setNewColorName('');
      setNewColorImage('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleColorway = async (id: string, available: boolean) => {
    setColorways((prev) => prev.map((c) => (c.id === id ? { ...c, available } : c)));
    await updateColorway(id, { available });
  };

  const handleDeleteColorway = async (id: string) => {
    if (!confirm('¿Eliminar este colorway y sus tallas?')) return;
    await deleteColorway(id);
    await refresh();
  };

  const handleAddSize = async (colorwayId: string) => {
    const size = (newSizeByColorway[colorwayId] || '').trim();
    if (!size) return;
    setBusy(true);
    try {
      await addSize(colorwayId, size);
      setNewSizeByColorway((prev) => ({ ...prev, [colorwayId]: '' }));
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSize = async (colorwayId: string, sizeId: string, available: boolean) => {
    setColorways((prev) =>
      prev.map((c) =>
        c.id === colorwayId
          ? { ...c, sizes: (c.sizes || []).map((s) => (s.id === sizeId ? { ...s, available } : s)) }
          : c
      )
    );
    await updateSize(sizeId, available);
  };

  const handleDeleteSize = async (sizeId: string) => {
    await deleteSize(sizeId);
    await refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-[28px] shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 sticky top-0 bg-white rounded-t-[28px]">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Colores y tallas</h2>
            <p className="text-xs text-slate-400">{product.name}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {colorways.map((c) => (
            <div key={c.id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="relative w-10 h-10 shrink-0 cursor-pointer group">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                    {uploadingColorwayId === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleReplaceColorwayImage(c.id, e)}
                    disabled={uploadingColorwayId === c.id}
                    className="hidden"
                  />
                </label>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                </div>
                <button
                  onClick={() => handleToggleColorway(c.id, !c.available)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    c.available
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {c.available ? 'Disponible' : 'Agotado'}
                </button>
                <button
                  onClick={() => handleDeleteColorway(c.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tallas de este colorway */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(c.sizes || []).map((s) => (
                  <button
                    key={s.id}
                    onDoubleClick={() => handleDeleteSize(s.id)}
                    onClick={() => handleToggleSize(c.id, s.id, !s.available)}
                    title="Click: activar/desactivar · Doble click: eliminar"
                    className={`w-10 h-10 rounded-xl text-xs font-semibold border transition-colors ${
                      s.available
                        ? 'bg-white border-slate-200 text-slate-700 hover:border-brand-blue'
                        : 'bg-slate-100 border-slate-100 text-slate-400 line-through'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSizeByColorway[c.id] || ''}
                  onChange={(e) => setNewSizeByColorway((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Nueva talla (ej: 40)"
                  className="text-xs px-3 py-2 bg-slate-50/60 border border-slate-100 rounded-xl w-32 outline-none focus:border-brand-blue"
                />
                <button
                  disabled={busy}
                  onClick={() => handleAddSize(c.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-brand-blue hover:text-brand-blue transition-colors"
                >
                  + Agregar talla
                </button>
              </div>
            </div>
          ))}

          {/* Agregar nuevo colorway */}
          <div className="border border-dashed border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Agregar nuevo colorway
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-start">
              <input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Nombre del color (ej: Azul/Vino)"
                className="flex-1 w-full text-sm px-3 py-2.5 bg-slate-50/60 border border-slate-100 rounded-xl outline-none focus:border-brand-blue"
              />

              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer hover:border-brand-blue hover:text-brand-blue transition-colors shrink-0">
                {uploadingNew ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : newColorImage ? (
                  <img src={newColorImage} alt="" className="w-5 h-5 rounded object-cover" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {newColorImage ? 'Cambiar foto' : 'Elegir foto'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleNewColorImageSelected}
                  disabled={uploadingNew}
                  className="hidden"
                />
              </label>

              <button
                disabled={busy || uploadingNew}
                onClick={handleAddColorway}
                className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-brand-blue text-white hover:bg-slate-950 transition-colors shrink-0 disabled:opacity-60"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
            {error && <p className="text-[11px] text-rose-600 mt-2">{error}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
