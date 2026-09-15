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
  ArrowLeft,
  Download,
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

const PRODUCTS_PER_PAGE = 20;

// Mismo patrón de escape que ya usa AdminOrders.tsx para exportar CSV.
function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Todos' | 'Dama' | 'Caballero' | 'Unisex'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | DbStatus>('Todos');
  const [brandFilter, setBrandFilter] = useState('Todas');
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, statusFilter, brandFilter, showArchived]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE),
    [filtered, currentPage]
  );

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

  // Exporta TODO el catálogo (activos + archivados), ignorando la
  // paginación de la lista — por eso pide los productos de nuevo en vez de
  // usar el estado "products" (que solo trae la vista activa o la archivada
  // según el toggle, nunca ambas a la vez).
  const handleExportCatalog = async () => {
    setExporting(true);
    try {
      const allProducts = await fetchAdminProducts({ includeArchived: true });
      const headers = [
        'Nombre',
        'Marca',
        'Categoría',
        'Género',
        'Precio',
        'Precio anterior',
        'Estado',
        'Destacado',
        'Archivado',
      ];
      const rows = allProducts.map((p) => [
        p.name,
        p.brand || '',
        p.style || '',
        p.gender || '',
        p.price ?? '',
        p.original_price ?? '',
        STATUS_LABEL[p.status],
        p.is_hot ? 'Sí' : 'No',
        p.archived ? 'Sí' : 'No',
      ]);
      const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
      const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo exportar el catálogo: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          {showArchived && (
            <button
              onClick={() => setShowArchived(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-blue dark:text-slate-500 dark:hover:text-brand-sky mb-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a Productos
            </button>
          )}
          <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
            {showArchived ? 'Productos archivados' : 'Productos'}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">{products.length} {showArchived ? 'archivados' : 'en catálogo'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCatalog}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Exportando...' : 'Exportar catálogo'}
          </button>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
              showArchived
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'text-slate-500 border-slate-200 hover:border-slate-300 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
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
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 focus:border-brand-blue outline-none rounded-2xl transition-all shadow-xs"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none shadow-xs"
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
          className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none shadow-xs"
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
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Barra de acciones en lote */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-brand-blue/5 dark:bg-brand-sky/10 border border-brand-blue/20 dark:border-brand-sky/20 rounded-2xl flex-wrap">
          <span className="text-xs font-bold text-brand-blue dark:text-brand-sky">{selected.size} seleccionados</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Marcar como:</span>
          <button
            onClick={() => handleBulkStatus('disponible')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/70"
          >
            Disponible
          </button>
          <button
            onClick={() => handleBulkStatus('agotado')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Agotado
          </button>
          <button
            onClick={() => handleBulkStatus('proximamente')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900 hover:bg-sky-100 dark:hover:bg-sky-950/70"
          >
            Próximamente
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-auto"
          >
            Cancelar
          </button>
        </div>
      )}

      {loading && <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">Cargando catálogo...</div>}
      {error && !loading && (
        <div className="text-center py-16 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">
              {showArchived ? 'No hay productos archivados.' : 'No hay productos que coincidan con la búsqueda.'}
            </div>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-50 dark:border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 w-full text-left"
              >
                {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-brand-blue" /> : <Square className="w-4 h-4" />}
                Seleccionar todos
              </button>

              <AnimatePresence initial={false}>
                {paginated.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <button onClick={() => toggleSelectOne(p.id)} className="shrink-0">
                      {selected.has(p.id) ? (
                        <CheckSquare className="w-4.5 h-4.5 text-brand-blue dark:text-brand-sky" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <img
                      src={p.colorways?.[0]?.image_url || p.images?.[0] || ''}
                      alt={p.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{p.name}</p>
                        {p.is_new && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
                            <Tag className="w-3 h-3" /> Nuevo
                          </span>
                        )}
                        {p.is_hot && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" /> Destacado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
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
                                p.is_new
                                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-600 dark:text-sky-400'
                                  : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Marcar como destacado"
                              onClick={() => handleToggle(p.id, 'is_hot', !p.is_hot)}
                              className={`p-2 rounded-xl border transition-colors ${
                                p.is_hot
                                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                                  : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as DbStatus)}
                            className={`text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer shrink-0 dark:brightness-110 ${STATUS_STYLE[p.status]}`}
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
                          className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:text-slate-500 dark:hover:text-brand-sky dark:hover:bg-slate-800 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {showArchived ? (
                          <>
                            <button
                              title="Restaurar"
                              onClick={() => handleRestore(p.id)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
                            >
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                            <button
                              title="Eliminar definitivamente"
                              onClick={() => handleDeleteClick(p.id, p.name)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Duplicar"
                              onClick={() => handleDuplicate(p)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:text-slate-500 dark:hover:text-brand-sky dark:hover:bg-slate-800 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              title="Editar"
                              onClick={() => openEditProduct(p)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:text-slate-500 dark:hover:text-brand-sky dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              title="Archivar"
                              onClick={() => handleArchiveClick(p.id)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
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

      {!loading && !error && filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-100 dark:disabled:hover:border-slate-800 transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-xl text-xs font-semibold border transition-colors ${
                page === currentPage
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:border-slate-100 dark:disabled:hover:border-slate-800 transition-colors"
          >
            Siguiente
          </button>
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
