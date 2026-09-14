import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { DbProductHistory, fetchProductHistory } from '../../lib/products';

interface ProductHistoryModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

const CHANGE_TYPE_LABEL: Record<DbProductHistory['change_type'], string> = {
  created: 'Creado',
  updated: 'Actualizado',
  archived: 'Archivado',
  restored: 'Restaurado',
};

const CHANGE_TYPE_STYLE: Record<DbProductHistory['change_type'], string> = {
  created: 'bg-sky-50 text-sky-700 border-sky-200',
  updated: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  archived: 'bg-rose-50 text-rose-700 border-rose-200',
  restored: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function ProductHistoryModal({ productId, productName, onClose }: ProductHistoryModalProps) {
  const [history, setHistory] = useState<DbProductHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductHistory(productId)
      .then(setHistory)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-[28px] shadow-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 sticky top-0 bg-white rounded-t-[28px] z-10">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Historial de cambios</h2>
            <p className="text-xs text-slate-400 truncate">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-sm text-rose-600 bg-rose-50 rounded-2xl border border-rose-100">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">Sin cambios registrados todavía.</div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wider">Fecha</th>
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wider">Campo</th>
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wider">Valor anterior</th>
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wider">Valor nuevo</th>
                    <th className="py-2 font-semibold uppercase tracking-wider">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">{formatDate(h.changed_at)}</td>
                      <td className="py-2.5 pr-3 text-slate-700 font-medium">{h.field_changed || '—'}</td>
                      <td className="py-2.5 pr-3 text-slate-400 max-w-[140px] truncate">{h.old_value ?? '—'}</td>
                      <td className="py-2.5 pr-3 text-slate-900 max-w-[140px] truncate">{h.new_value ?? '—'}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${CHANGE_TYPE_STYLE[h.change_type]}`}
                        >
                          {CHANGE_TYPE_LABEL[h.change_type]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
