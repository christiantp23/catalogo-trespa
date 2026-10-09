import { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    Package,
    Store,
    Grid3X3,
    RefreshCw,
    Download,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Archive,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Users,
    Venus,
    Mars,
    Tag,
    ArrowUpDown,
    Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
    DbProduct,
    DbStatus,
    fetchAdminProducts,
    updateProduct,
} from '../../lib/products';

interface Props {
    onNavigateToProducts?: (filterBrand?: string, filterGender?: string) => void;
}

type ViewMode = 'genero' | 'marca' | 'cruzado';

const STATUS_LABELS: Record<DbStatus, string> = {
    disponible: 'Disponible (Activo)',
    agotado: 'Agotado (No activo)',
    proximamente: 'Próximamente (No activo)',
};

const STATUS_BADGES: Record<DbStatus, string> = {
    disponible:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    agotado:
        'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    proximamente:
        'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800',
};

// Formato de moneda colombiana
function formatCOP(price: number | null | undefined): string {
    if (!price) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(price);
}

export default function AdminInventoryMetrics({ onNavigateToProducts }: Props) {
    const [products, setProducts] = useState<DbProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [includeArchived, setIncludeArchived] = useState(false);

    // Vista activa y filtros
    const [viewMode, setViewMode] = useState<ViewMode>('genero');
    const [searchBrand, setSearchBrand] = useState('');

    // Tarjetas expandidas para ver listado de productos (permite expandir múltiples o todas)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Ordenamiento para la vista de marcas
    const [brandSort, setBrandSort] = useState<'total' | 'activos' | 'inactivos' | 'nombre'>('total');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminProducts({ includeArchived: true });
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtrar productos según si se incluyen archivados o no
    const workingProducts = useMemo(() => {
        if (includeArchived) return products;
        return products.filter((p) => !p.archived);
    }, [products, includeArchived]);

    // Actualizar estado de un producto inline
    const handleUpdateStatus = async (productId: string, newStatus: DbStatus) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        );
        try {
            await updateProduct(productId, { status: newStatus });
        } catch (err) {
            alert('Error al actualizar estado: ' + (err instanceof Error ? err.message : ''));
            loadData();
        }
    };

    // ==========================================
    // 1. CÁLCULOS GLOBALES (KPIs)
    // ==========================================
    const globalStats = useMemo(() => {
        const total = workingProducts.length;
        const activos = workingProducts.filter((p) => p.status === 'disponible').length;
        const agotados = workingProducts.filter((p) => p.status === 'agotado').length;
        const proximamente = workingProducts.filter((p) => p.status === 'proximamente').length;
        const noActivos = agotados + proximamente;
        const archivados = products.filter((p) => p.archived).length;

        const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0;
        const pctNoActivos = total > 0 ? Math.round((noActivos / total) * 100) : 0;

        const brandSet = new Set(workingProducts.map((p) => p.brand || 'Sin marca'));

        return {
            total,
            activos,
            noActivos,
            agotados,
            proximamente,
            archivados,
            pctActivos,
            pctNoActivos,
            totalBrands: brandSet.size,
        };
    }, [workingProducts, products]);

    // ==========================================
    // 2. CÁLCULO POR GÉNERO
    // ==========================================
    const genderStats = useMemo(() => {
        const categories: Array<{ id: string; label: string; icon: typeof Users }> = [
            { id: 'Caballero', label: 'Caballero', icon: Mars },
            { id: 'Dama', label: 'Dama', icon: Venus },
            { id: 'Unisex', label: 'Unisex', icon: Users },
            { id: 'Sin asignar', label: 'Sin asignar', icon: Tag },
        ];

        return categories
            .map(({ id, label, icon: Icon }) => {
                const groupProducts = workingProducts.filter((p) => {
                    if (id === 'Sin asignar') return !p.gender || (p.gender !== 'Caballero' && p.gender !== 'Dama' && p.gender !== 'Unisex');
                    return p.gender === id;
                });

                const total = groupProducts.length;
                const activos = groupProducts.filter((p) => p.status === 'disponible');
                const agotados = groupProducts.filter((p) => p.status === 'agotado');
                const proximamente = groupProducts.filter((p) => p.status === 'proximamente');
                const noActivos = [...agotados, ...proximamente];

                const pctActivos = total > 0 ? Math.round((activos.length / total) * 100) : 0;
                const pctNoActivos = total > 0 ? 100 - pctActivos : 0;

                return {
                    id,
                    label,
                    icon: Icon,
                    total,
                    activosCount: activos.length,
                    noActivosCount: noActivos.length,
                    agotadosCount: agotados.length,
                    proximamenteCount: proximamente.length,
                    pctActivos,
                    pctNoActivos,
                    products: groupProducts,
                };
            })
            .filter((g) => g.total > 0 || g.id !== 'Sin asignar');
    }, [workingProducts]);

    // ==========================================
    // 3. CÁLCULO POR MARCA
    // ==========================================
    const brandStats = useMemo(() => {
        const brandMap = new Map<
            string,
            {
                brand: string;
                total: number;
                activos: DbProduct[];
                agotados: DbProduct[];
                proximamente: DbProduct[];
                noActivos: DbProduct[];
                products: DbProduct[];
            }
        >();

        workingProducts.forEach((p) => {
            const brand = p.brand?.trim() || 'Sin marca';
            if (!brandMap.has(brand)) {
                brandMap.set(brand, {
                    brand,
                    total: 0,
                    activos: [],
                    agotados: [],
                    proximamente: [],
                    noActivos: [],
                    products: [],
                });
            }

            const entry = brandMap.get(brand)!;
            entry.total += 1;
            entry.products.push(p);

            if (p.status === 'disponible') {
                entry.activos.push(p);
            } else if (p.status === 'agotado') {
                entry.agotados.push(p);
                entry.noActivos.push(p);
            } else {
                entry.proximamente.push(p);
                entry.noActivos.push(p);
            }
        });

        let list = Array.from(brandMap.values()).map((item) => {
            const pctActivos = item.total > 0 ? Math.round((item.activos.length / item.total) * 100) : 0;
            const pctNoActivos = item.total > 0 ? 100 - pctActivos : 0;
            return {
                ...item,
                pctActivos,
                pctNoActivos,
            };
        });

        // Filtro de búsqueda por texto de marca
        if (searchBrand.trim()) {
            const q = searchBrand.toLowerCase().trim();
            list = list.filter((b) => b.brand.toLowerCase().includes(q));
        }

        // Ordenamiento
        list.sort((a, b) => {
            if (brandSort === 'total') return b.total - a.total;
            if (brandSort === 'activos') return b.activos.length - a.activos.length;
            if (brandSort === 'inactivos') return b.noActivos.length - a.noActivos.length;
            if (brandSort === 'nombre') return a.brand.localeCompare(b.brand);
            return 0;
        });

        return list;
    }, [workingProducts, searchBrand, brandSort]);

    // ==========================================
    // 4. MATRIZ CRUZADA (GÉNERO × MARCA)
    // ==========================================
    const crossMatrix = useMemo(() => {
        const brands = Array.from(new Set(workingProducts.map((p) => p.brand?.trim() || 'Sin marca'))).sort();
        const genders = ['Caballero', 'Dama', 'Unisex'];

        return brands.map((brand) => {
            const brandProducts = workingProducts.filter((p) => (p.brand?.trim() || 'Sin marca') === brand);

            const genderBreakdown = genders.map((g) => {
                const matching = brandProducts.filter((p) => p.gender === g);
                const activos = matching.filter((p) => p.status === 'disponible').length;
                const noActivos = matching.length - activos;
                return {
                    gender: g,
                    total: matching.length,
                    activos,
                    noActivos,
                };
            });

            const totalBrand = brandProducts.length;
            const totalActivos = brandProducts.filter((p) => p.status === 'disponible').length;
            const totalNoActivos = totalBrand - totalActivos;

            return {
                brand,
                total: totalBrand,
                totalActivos,
                totalNoActivos,
                genderBreakdown,
            };
        });
    }, [workingProducts]);

    // ==========================================
    // EXPORTAR A CSV
    // ==========================================
    const handleExportCSV = () => {
        const headers = [
            'Tipo de Cálculo',
            'Categoría/Elemento',
            'Total Productos',
            'Activos (Disponibles)',
            'No Activos (Agotados + Próximamente)',
            '% Activos',
            '% No Activos',
        ];

        const rows: Array<Array<string | number>> = [];

        // Filas de género
        genderStats.forEach((g) => {
            rows.push([
                'Por Género',
                g.label,
                g.total,
                g.activosCount,
                g.noActivosCount,
                `${g.pctActivos}%`,
                `${g.pctNoActivos}%`,
            ]);
        });

        // Filas de marcas
        brandStats.forEach((b) => {
            rows.push([
                'Por Marca',
                b.brand,
                b.total,
                b.activos.length,
                b.noActivos.length,
                `${b.pctActivos}%`,
                `${b.pctNoActivos}%`,
            ]);
        });

        const csvContent = [headers, ...rows]
            .map((row) =>
                row
                    .map((val) => {
                        const str = String(val);
                        if (str.includes(',') || str.includes('"')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    })
                    .join(',')
            )
            .join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `metricas-genero-marca-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* ========================================================
          ENCABEZADO PRINCIPAL Y ACCIONES
          ======================================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-sky/10 dark:text-brand-sky inline-flex">
                            <BarChart3 className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-brand-sky">
                            Control de Inventario
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                        Métricas por Género y Marca
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Auditoría en tiempo real de productos subidos: activos (disponibles) vs. no activos (agotados o en espera).
                    </p>
                </div>

                {/* Barra de acciones: grid de 3 columnas en mobile (ancho 100% garantizado sin cortes) y flex en desktop */}
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    {/* Toggle incluir archivados */}
                    <button
                        type="button"
                        onClick={() => setIncludeArchived((v) => !v)}
                        className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 h-9 px-2 sm:px-3.5 rounded-xl text-xs font-semibold border transition-all shadow-xs ${includeArchived
                            ? 'bg-amber-500 text-white border-amber-600 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        title="Alternar inclusión de productos archivados"
                    >
                        <Archive className="w-3.5 h-3.5 shrink-0" />
                        <span className="sm:hidden truncate">{includeArchived ? 'Con archiv.' : 'Sin archiv.'}</span>
                        <span className="hidden sm:inline whitespace-nowrap">{includeArchived ? 'Archivados incluidos' : 'Ocultar archivados'}</span>
                    </button>

                    {/* Exportar a CSV */}
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-9 px-2 sm:px-3.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-blue hover:text-brand-blue dark:hover:text-brand-sky dark:hover:border-brand-sky transition-colors shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span className="sm:hidden">Exportar</span>
                        <span className="hidden sm:inline whitespace-nowrap">Exportar CSV</span>
                    </button>

                    {/* Refrescar */}
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-9 px-2 sm:px-3.5 rounded-xl text-xs font-semibold bg-brand-blue hover:bg-slate-950 dark:bg-brand-blue dark:hover:bg-blue-900 text-white transition-colors disabled:opacity-50 shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* ========================================================
          TARJETAS KPI RESUMEN SUPERIOR
          ======================================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
                {/* Total General */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Productos</span>
                        <Package className="w-4 h-4 text-brand-blue dark:text-brand-sky shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                            {globalStats.total}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-400">subidos</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                        En {globalStats.totalBrands} marcas distintas
                    </p>
                </div>

                {/* Activos (Disponibles) */}
                <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/40 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Activos (En Venta)</span>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
                            {globalStats.activos}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                            {globalStats.pctActivos}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 sm:mt-3 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${globalStats.pctActivos}%` }}
                        />
                    </div>
                </div>

                {/* No Activos (Agotados / Próximamente) */}
                <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">No Activos</span>
                        <XCircle className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-3xl font-black font-display text-rose-600 dark:text-rose-400">
                            {globalStats.noActivos}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md">
                            {globalStats.pctNoActivos}%
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between gap-1 flex-wrap">
                        <span>{globalStats.agotados} agotados</span>
                        <span>{globalStats.proximamente} próximamente</span>
                    </p>
                </div>

                {/* Tasa de Disponibilidad */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Disponibilidad Tienda</span>
                        <Store className="w-4 h-4 text-brand-blue dark:text-brand-sky shrink-0" />
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                            {globalStats.pctActivos}%
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400">en vitrina</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                        {globalStats.activos} de {globalStats.total} para venta WhatsApp
                    </p>
                </div>
            </div>

            {/* ========================================================
          BARRA DE PESTAÑAS (VISTA)
          ======================================================== */}
            <div className="w-full sm:w-fit grid grid-cols-3 sm:flex items-center gap-1 mb-6 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <button
                    type="button"
                    onClick={() => setViewMode('genero')}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${viewMode === 'genero'
                        ? 'bg-white dark:bg-slate-900 text-brand-blue dark:text-brand-sky shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Por Género</span>
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('marca')}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${viewMode === 'marca'
                        ? 'bg-white dark:bg-slate-900 text-brand-blue dark:text-brand-sky shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>Por Marca</span>
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('cruzado')}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${viewMode === 'cruzado'
                        ? 'bg-white dark:bg-slate-900 text-brand-blue dark:text-brand-sky shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Matriz</span>
                </button>
            </div>

            {loading && (
                <div className="text-center py-20 text-sm text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-brand-blue dark:text-brand-sky" />
                    <span>Calculando métricas de inventario...</span>
                </div>
            )}

            {error && !loading && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs text-center mb-6">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* ========================================================
              VISTA 1: CÁLCULO POR GÉNERO
              ======================================================== */}
                    {viewMode === 'genero' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {genderStats.map((item) => {
                                    const Icon = item.icon;
                                    const isExpanded = expandedSections.has(`gender-${item.id}`);
                                    const displayedProducts = item.products;

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all hover:border-slate-200 dark:hover:border-slate-700 flex flex-col"
                                        >
                                            {/* Cabecera del Género */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                                                            {item.label}
                                                        </h2>
                                                        <span className="text-[11px] text-slate-400">
                                                            {item.total} {item.total === 1 ? 'producto' : 'productos'} en total
                                                        </span>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${item.pctActivos >= 70
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                                                        : item.pctActivos >= 40
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                                                        }`}
                                                >
                                                    {item.pctActivos}% activos
                                                </span>
                                            </div>

                                            {/* Barra de Distribución Activos vs Inactivos */}
                                            <div className="mb-4">
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                                                    <div
                                                        className="bg-emerald-500 h-full transition-all duration-300"
                                                        style={{ width: `${item.pctActivos}%` }}
                                                        title={`Activos: ${item.activosCount} (${item.pctActivos}%)`}
                                                    />
                                                    <div
                                                        className="bg-rose-400 h-full transition-all duration-300"
                                                        style={{ width: `${item.pctNoActivos}%` }}
                                                        title={`No activos: ${item.noActivosCount} (${item.pctNoActivos}%)`}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {item.pctActivos}% activos
                                                    </span>
                                                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                        {item.pctNoActivos}% no activos
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Desglose de Contadores */}
                                            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Activos
                                                    </span>
                                                    <span className="text-xl font-bold font-display text-slate-900 dark:text-white mt-0.5">
                                                        {item.activosCount}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">Listos en tienda</span>
                                                </div>

                                                <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" /> No activos
                                                    </span>
                                                    <span className="text-xl font-bold font-display text-slate-900 dark:text-white mt-0.5">
                                                        {item.noActivosCount}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {item.agotadosCount} agot. / {item.proximamenteCount} próx.
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Botón expandir lista de productos */}
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(`gender-${item.id}`)}
                                                className="mt-auto w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp className="w-3.5 h-3.5" /> Ocultar lista ({displayedProducts.length})
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-3.5 h-3.5" /> Ver productos ({displayedProducts.length})
                                                    </>
                                                )}
                                            </button>

                                            {/* Lista desplegable de productos de este género */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                                                    >
                                                        {displayedProducts.length === 0 ? (
                                                            <p className="text-xs text-slate-400 text-center py-4">
                                                                No hay productos para el filtro seleccionado.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                                                {displayedProducts.map((p) => {
                                                                    const mainImage = p.images?.[0] || p.colorways?.[0]?.image_url || '/logo.webp';
                                                                    return (
                                                                        <div
                                                                            key={p.id}
                                                                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <img
                                                                                    src={mainImage}
                                                                                    alt={p.name}
                                                                                    className="w-10 h-10 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                                                                                />
                                                                                <div className="min-w-0">
                                                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                                                        {p.name}
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-400">
                                                                                        {p.brand || 'Sin marca'} • {formatCOP(p.price)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Selector rápido de estado */}
                                                                            <select
                                                                                value={p.status}
                                                                                onChange={(e) => handleUpdateStatus(p.id, e.target.value as DbStatus)}
                                                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer shrink-0 ${STATUS_BADGES[p.status]}`}
                                                                            >
                                                                                <option value="disponible">Activo</option>
                                                                                <option value="agotado">Agotado</option>
                                                                                <option value="proximamente">Próx.</option>
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================
              VISTA 2: CÁLCULO POR MARCA
              ======================================================== */}
                    {viewMode === 'marca' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                            {/* Barra de búsqueda y orden de marcas */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchBrand}
                                        onChange={(e) => setSearchBrand(e.target.value)}
                                        placeholder="Filtrar marca por nombre (Nike, Adidas, etc.)..."
                                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-brand-blue dark:focus:border-brand-sky text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                        <ArrowUpDown className="w-3 h-3" /> Ordenar por:
                                    </span>
                                    <select
                                        value={brandSort}
                                        onChange={(e) => setBrandSort(e.target.value as any)}
                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
                                    >
                                        <option value="total">Mayor cantidad total</option>
                                        <option value="activos">Mayor activos</option>
                                        <option value="inactivos">Mayor inactivos</option>
                                        <option value="nombre">Nombre A-Z</option>
                                    </select>
                                </div>
                            </div>

                            {/* Lista / Acordeón de marcas */}
                            {brandStats.length === 0 ? (
                                <div className="text-center py-12 text-xs text-slate-400">
                                    No se encontraron marcas con el filtro actual.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {brandStats.map((b) => {
                                        const isExpanded = expandedSections.has(`brand-${b.brand}`);
                                        const displayedProducts = b.products;

                                        return (
                                            <div
                                                key={b.brand}
                                                className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    {/* Identificación de la marca y total */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-brand-blue/10 dark:bg-brand-sky/10 text-brand-blue dark:text-brand-sky flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                            {b.brand.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                                {b.brand}
                                                                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                                    {b.total} {b.total === 1 ? 'producto' : 'productos'}
                                                                </span>
                                                            </h3>
                                                            <p className="text-[11px] text-slate-400">
                                                                {b.pctActivos}% disponible en vitrina pública
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Estadísticas de la marca */}
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <div className="flex items-center gap-3">
                                                            {/* Activos */}
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    {b.activos.length}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400">activos</span>
                                                            </div>

                                                            {/* No activos */}
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    {b.noActivos.length}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400">no activos</span>
                                                            </div>
                                                        </div>

                                                        {/* Barra mini de progreso */}
                                                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:flex">
                                                            <div
                                                                className="bg-emerald-500 h-full"
                                                                style={{ width: `${b.pctActivos}%` }}
                                                            />
                                                            <div
                                                                className="bg-rose-400 h-full"
                                                                style={{ width: `${b.pctNoActivos}%` }}
                                                            />
                                                        </div>

                                                        {/* Botón ver productos */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSection(`brand-${b.brand}`)}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors ml-auto sm:ml-0"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp className="w-3.5 h-3.5" /> Ocultar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-3.5 h-3.5" /> Detalle ({displayedProducts.length})
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Listado desplegable de la marca */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                                                        >
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                                {displayedProducts.map((p) => {
                                                                    const mainImage = p.images?.[0] || p.colorways?.[0]?.image_url || '/logo.webp';
                                                                    return (
                                                                        <div
                                                                            key={p.id}
                                                                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <img
                                                                                    src={mainImage}
                                                                                    alt={p.name}
                                                                                    className="w-11 h-11 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                                                                                />
                                                                                <div className="min-w-0">
                                                                                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                                                                        {p.name}
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-400">
                                                                                        {p.gender || 'Sin género'} • {formatCOP(p.price)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <select
                                                                                value={p.status}
                                                                                onChange={(e) => handleUpdateStatus(p.id, e.target.value as DbStatus)}
                                                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer shrink-0 ${STATUS_BADGES[p.status]}`}
                                                                            >
                                                                                <option value="disponible">Activo</option>
                                                                                <option value="agotado">Agotado</option>
                                                                                <option value="proximamente">Próx.</option>
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================
              VISTA 3: MATRIZ CRUZADA (GÉNERO × MARCA)
              ======================================================== */}
                    {viewMode === 'cruzado' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
                            <div className="mb-4">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                    Matriz Cruzada: Marca vs. Género
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Visualiza cuántos productos activos (verde) y no activos (rojo) tienes para cada combinación de marca y género.
                                </p>
                            </div>

                            {/* Contenedor con scroll horizontal táctil suave en pantallas pequeñas */}
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
                                <table className="w-full min-w-140 text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                                            <th className="py-3 px-3 font-bold">Marca</th>
                                            <th className="py-3 px-3 font-bold text-center">Caballero</th>
                                            <th className="py-3 px-3 font-bold text-center">Dama</th>
                                            <th className="py-3 px-3 font-bold text-center">Unisex</th>
                                            <th className="py-3 px-3 font-bold text-right">Total Marca</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {crossMatrix.map((row) => (
                                            <tr
                                                key={row.brand}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                                    {row.brand}
                                                </td>

                                                {/* Caballero, Dama, Unisex */}
                                                {row.genderBreakdown.map((g) => (
                                                    <td key={g.gender} className="py-3 px-3 text-center">
                                                        {g.total === 0 ? (
                                                            <span className="text-slate-300 dark:text-slate-600">-</span>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                                <span className="font-bold text-emerald-600 dark:text-emerald-400" title="Activos">
                                                                    {g.activos}
                                                                </span>
                                                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                                                <span className="font-bold text-rose-600 dark:text-rose-400" title="No activos">
                                                                    {g.noActivos}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 ml-1">
                                                                    ({g.total})
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}

                                                {/* Total Marca */}
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {row.totalActivos} act.
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                                        <span className="font-bold text-rose-600 dark:text-rose-400">
                                                            {row.totalNoActivos} inact.
                                                        </span>
                                                        <span className="font-black text-slate-900 dark:text-white ml-1">
                                                            ({row.total})
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                                <span>Convención de celdas: <strong className="text-emerald-600 dark:text-emerald-400">Activos</strong> / <strong className="text-rose-600 dark:text-rose-400">No Activos</strong> (Total en celda)</span>
                                <span>Total marcas analizadas: {crossMatrix.length}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
