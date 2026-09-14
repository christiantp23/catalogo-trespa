import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag,
  Flame,
  Copy,
  CheckSquare,
  Square,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DbProduct,
  DbStatus,
  fetchAdminProducts,
  fetchArchivedProducts,
  updateProduct,
  archiveProduct,
  restoreProduct,
  permanentlyDeleteProduct,
  duplicateProduct,
  logProductChange,
} from '../../lib/products';
import ProductFormModal from './ProductFormModal';
import ConfirmModal from './ConfirmModal';
import ProductHistoryModal from './ProductHistoryModal';

const STATUS_LABEL: Record<DbStatus, string> = {
  disponible: 'Disponible',
  agotado: 'Agotado',
  proximamente: 'Próximamente',
};

const STATUS_STYLE: Record<DbStatus, string> = {
  disponible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  agotado: 'bg-slate-100 text-slate-500 border-slate-200',
  proximamente: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Todos' | 'Dama' | 'Caballero' | 'Unisex'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | DbStatus>('Todos');
  const [brandFilter, setBrandFilter] = useState('Todas');
  const [showArchived, setShowArchived] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  const [archiveConfirm, setArchiveConfirm] = useState<{ show: boolean; productId?: string }>({ show: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId?: string; productName?: string }>({
    show: false,
  });
  const [historyModal, setHistoryModal] = useState<{ show: boolean; productId?: string; productName?: string }>({
    show: false,
  });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = showArchived ? await fetchArchivedProducts() : await fetchAdminProducts();
      setProducts(data);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const brands = useMemo(
    () => ['Todas', ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))] as string[],
    [products]
  );

  // Categorías (campo "style") ya usadas en el catálogo, para el select del
  // formulario de producto. No hace falta guardarlas en ningún lado aparte:
  // en cuanto se crea un producto con una categoría nueva, esta lista se
  // recalcula sola y ya queda disponible para el próximo producto.
  const productStyles = useMemo(
    () => Array.from(new Set(products.map((p) => p.style).filter(Boolean))).sort() as string[],
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(search.toLowerCase());
      const matchesGender = genderFilter === 'Todos' || p.gender === genderFilter;
      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      const matchesBrand = brandFilter === 'Todas' || p.brand === brandFilter;
      return matchesSearch && matchesGender && matchesStatus && matchesBrand;
    });
  }, [products, search, genderFilter, statusFilter, brandFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (id: string, status: DbStatus) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await updateProduct(id, { status });
    } catch {
      loadProducts();
    }
  };

  const handleBulkStatus = async (status: DbStatus) => {
    const ids = Array.from(selected);
    setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p)));
    await Promise.all(ids.map((id) => updateProduct(id, { status })));
    setSelected(new Set());
  };

  const handleToggle = async (id: string, field: 'is_new' | 'is_hot', value: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    try {
      await updateProduct(id, { [field]: value });
    } catch {
      loadProducts();
    }
  };

  const handleDuplicate = async (p: DbProduct) => {
    try {
      await duplicateProduct(p);
      loadProducts();
    } catch (err) {
      alert('No se pudo duplicar: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleArchiveClick = (id: string) => {
    setArchiveConfirm({ show: true, productId: id });
  };

  const handleConfirmArchive = async () => {
    const id = archiveConfirm.productId;
    setArchiveConfirm({ show: false });
    if (!id) return;
    const p = products.find((prod) => prod.id === id);
    try {
      await archiveProduct(id);
      if (p) await logProductChange(id, p.name, 'archived', null, null, null);
      setProducts((prev) => prev.filter((prod) => prod.id !== id));
    } catch (err) {
      alert('No se pudo archivar: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleOpenHistory = (id: string, name: string) => {
    setHistoryModal({ show: true, productId: id, productName: name });
  };

  const handleRestore = async (id: string) => {
    const p = products.find((prod) => prod.id === id);
    try {
      await restoreProduct(id);
      if (p) await logProductChange(id, p.name, 'restored', null, null, null);
      setProducts((prev) => prev.filter((prod) => prod.id !== id));
    } catch (err) {
      alert('No se pudo restaurar: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ show: true, productId: id, productName: name });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirm.productId;
    setDeleteConfirm({ show: false });
    if (!id) return;
    try {
      await permanentlyDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('No se pudo eliminar: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEditProduct = (p: DbProduct) => {
    setEditingProduct(p);
    setFormOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-lg text-slate-900 leading-tight">
            {showArchived ? 'Productos archivados' : 'Productos'}
          </h1>
          <p className="text-xs text-slate-400">{products.length} {showArchived ? 'archivados' : 'en catálogo'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
              showArchived
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {showArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}{' '}
            {showArchived ? 'Ver activos' : 'Ver archivados'}
          </button>
          {!showArchived && (
            <button
              onClick={openNewProduct}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wide transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Nuevo producto
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: búsqueda + filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-100 focus:border-brand-blue outline-none rounded-2xl transition-all shadow-xs"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-100 bg-white text-slate-600 outline-none shadow-xs"
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'Todos' | DbStatus)}
          className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-100 bg-white text-slate-600 outline-none shadow-xs"
        >
          <option value="Todos">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="proximamente">Próximamente</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4">
        {(['Todos', 'Dama', 'Caballero', 'Unisex'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGenderFilter(g)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition-colors ${
              genderFilter === g
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Barra de acciones en lote */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl flex-wrap">
          <span className="text-xs font-bold text-brand-blue">{selected.size} seleccionados</span>
          <span className="text-xs text-slate-400">Marcar como:</span>
          <button
            onClick={() => handleBulkStatus('disponible')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          >
            Disponible
          </button>
          <button
            onClick={() => handleBulkStatus('agotado')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
          >
            Agotado
          </button>
          <button
            onClick={() => handleBulkStatus('proximamente')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
          >
            Próximamente
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 ml-auto"
          >
            Cancelar
          </button>
        </div>
      )}

      {loading && <div className="text-center py-16 text-sm text-slate-400">Cargando catálogo...</div>}
      {error && !loading && (
        <div className="text-center py-16 text-sm text-rose-600 bg-rose-50 rounded-2xl border border-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-slate-100 rounded-[28px] shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400">
              {showArchived ? 'No hay productos archivados.' : 'No hay productos que coincidan con la búsqueda.'}
            </div>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-50 text-xs font-semibold text-slate-400 hover:text-slate-600 w-full text-left"
              >
                {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-brand-blue" /> : <Square className="w-4 h-4" />}
                Seleccionar todos
              </button>

              <AnimatePresence initial={false}>
                {filtered.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <button onClick={() => toggleSelectOne(p.id)} className="shrink-0">
                      {selected.has(p.id) ? (
                        <CheckSquare className="w-4.5 h-4.5 text-brand-blue" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-300" />
                      )}
                    </button>

                    <img
                      src={p.colorways?.[0]?.image_url || p.images?.[0] || ''}
                      alt={p.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 truncate">{p.name}</p>
                        {p.is_new && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                            <Tag className="w-3 h-3" /> Nuevo
                          </span>
                        )}
                        {p.is_hot && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" /> Destacado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {p.brand} · {p.gender} · ${p.price?.toLocaleString('es-CO')}
                      </p>
                    </div>

                    {/* Controles (estado + acciones): en mobile ocupan su
                        propia fila completa debajo de la info del producto
                        (w-full fuerza el wrap de forma predecible en vez de
                        dejar que se aprieten/recorten); en desktop vuelven a
                        sentarse en la misma fila de siempre, sin cambios. */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {!showArchived && (
                        <>
                          <div className="hidden md:flex items-center gap-1 shrink-0">
                            <button
                              title="Marcar como nuevo"
                              onClick={() => handleToggle(p.id, 'is_new', !p.is_new)}
                              className={`p-2 rounded-xl border transition-colors ${
                                p.is_new ? 'bg-sky-50 border-sky-200 text-sky-600' : 'border-slate-100 text-slate-300 hover:text-slate-500'
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Marcar como destacado"
                              onClick={() => handleToggle(p.id, 'is_hot', !p.is_hot)}
                              className={`p-2 rounded-xl border transition-colors ${
                                p.is_hot ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-slate-100 text-slate-300 hover:text-slate-500'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as DbStatus)}
                            className={`text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer shrink-0 ${STATUS_STYLE[p.status]}`}
                          >
                            {(Object.keys(STATUS_LABEL) as DbStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      <div className="flex items-center gap-1 shrink-0 ml-auto md:ml-0">
                        <button
                          title="Ver cambios"
                          onClick={() => handleOpenHistory(p.id, p.name)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {showArchived ? (
                          <>
                            <button
                              title="Restaurar"
                              onClick={() => handleRestore(p.id)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                            <button
                              title="Eliminar definitivamente"
                              onClick={() => handleDeleteClick(p.id, p.name)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Duplicar"
                              onClick={() => handleDuplicate(p)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              title="Editar"
                              onClick={() => openEditProduct(p)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              title="Archivar"
                              onClick={() => handleArchiveClick(p.id)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <ProductFormModal
            product={editingProduct}
            existingStyles={productStyles}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              loadProducts();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {archiveConfirm.show && (
          <ConfirmModal
            title="Archivar producto"
            message="¿Archivar este producto? Deja de mostrarse en la tienda pero podés recuperarlo después."
            confirmText="Archivar"
            isDangerous={false}
            onConfirm={handleConfirmArchive}
            onCancel={() => setArchiveConfirm({ show: false })}
          />
        )}
        {deleteConfirm.show && (
          <ConfirmModal
            title="Eliminar definitivamente"
            message={`¿Eliminar "${deleteConfirm.productName}" definitivamente? Esto NO se puede deshacer.`}
            confirmText="Eliminar"
            isDangerous
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirm({ show: false })}
          />
        )}
        {historyModal.show && historyModal.productId && (
          <ProductHistoryModal
            productId={historyModal.productId}
            productName={historyModal.productName || ''}
            onClose={() => setHistoryModal({ show: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
