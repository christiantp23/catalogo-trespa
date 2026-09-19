import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Receipt,
  Trophy,
  MessageCircle,
  Package,
  Search,
  Download,
  Calendar,
  Clock,
  BellRing,
  Bell,
  X,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  DbOrder,
  OrderStatus,
  fetchOrders,
  confirmOrder,
  cancelOrder,
  revertOrderToPending,
} from '../../lib/orders';
import { DbProduct, fetchAdminProducts } from '../../lib/products';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelada: 'bg-slate-100 text-slate-500 border-slate-200',
};

// Valores guardados en orders.payment_method (ver CheckoutModal.tsx) -> texto legible.
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bold_tarjeta: 'Bold (tarjeta)',
  transferencia: 'Transferencia bancaria',
};

// Después de esta cantidad de fallos seguidos del polling silencioso,
// dejamos de tragarnos el error y avisamos.
const SYNC_FAIL_THRESHOLD = 2;

const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Semana de lunes a domingo.
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=domingo..6=sábado
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function isSameWeek(a: Date, b: Date) {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

// Devuelve la URL de imagen de un item de orden buscando el colorway
// exacto en el producto original; si no lo encuentra usa la primera foto
// del producto, y como último recurso el logo de la tienda.
function getItemImage(item: { product_id: string | null; colorway: string | null }, productsMap: Map<string, DbProduct>): string {
  if (!item.product_id) return '/logo.webp';
  const product = productsMap.get(item.product_id);
  if (!product) return '/logo.webp';
  const colorway = product.colorways?.find((c) => c.name === item.colorway);
  return colorway?.image_url || product.images?.[0] || '/logo.webp';
}

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

type FilterValue = OrderStatus | 'Todas';

interface NewOrderToast {
  id: string;
  customerName: string;
  total: number;
}

// Cada cuánto se revisa si hay órdenes nuevas mientras el panel de Ventas
// está abierto (45-60s, en el medio de ese rango).
const NEW_ORDER_POLL_MS = 50000;

export default function AdminOrders() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('pendiente');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [productsMap, setProductsMap] = useState<Map<string, DbProduct>>(new Map());

  // IDs de órdenes ya vistas, para detectar cuáles son nuevas en cada
  // poll — no dispara toasts en la primera carga, solo cuando aparece algo
  // que no estaba antes.
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const [newOrderToasts, setNewOrderToasts] = useState<NewOrderToast[]>([]);

  // Fallos consecutivos del polling silencioso: si se acumulan, avisamos
  // en vez de fallar en silencio (se resetea apenas un poll funciona).
  const [syncFailCount, setSyncFailCount] = useState(0);

  // Ventas nuevas detectadas por el polling que el admin todavía no revisó
  // (campanita del encabezado). Se limpia al hacer click en la campana.
  const [unseenCount, setUnseenCount] = useState(0);

  const load = async () => {
    setLoading(true);
    setIsSyncing(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
      knownOrderIdsRef.current = new Set(data.map((o) => o.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const dismissToast = (id: string) => {
    setNewOrderToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Revisa en silencio si hay órdenes nuevas (sin mostrar el spinner de
  // "Sincronizando..." ni tocar loading/error, para no interrumpir lo que
  // el admin esté mirando) y muestra un toast visual por cada una — sin
  // sonido, que suele molestar más de lo que ayuda en un panel web.
  const pollForNewOrders = async () => {
    try {
      const fresh = await fetchOrders();
      const known = knownOrderIdsRef.current;
      if (known) {
        const newOnes = fresh.filter((o) => !known.has(o.id));
        if (newOnes.length > 0) {
          setNewOrderToasts((prev) => [
            ...prev,
            ...newOnes.map((o) => ({ id: o.id, customerName: o.customer_name, total: o.total })),
          ]);
          newOnes.forEach((o) => {
            setTimeout(() => dismissToast(o.id), 8000);
          });
          // El toast se autodescarta a los 8s; esto queda como registro de
          // que hubo ventas nuevas aunque nadie estuviera mirando la pantalla.
          setUnseenCount((c) => c + newOnes.length);
        }
      }
      knownOrderIdsRef.current = new Set(fresh.map((o) => o.id));
      setOrders(fresh);
      setSyncFailCount(0);
    } catch {
      // El poll es silencioso (no toca loading/error) para no interrumpir,
      // pero si falla varias veces seguidas sí avisamos (ver syncFailCount).
      setSyncFailCount((c) => c + 1);
    }
  };

  const markNotificationsSeen = () => setUnseenCount(0);

  useEffect(() => {
    load();
    // Productos (con colorways) para poder mostrar la foto de cada item vendido.
    fetchAdminProducts({ includeArchived: true })
      .then((products) => setProductsMap(new Map(products.map((p) => [p.id, p]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(pollForNewOrders, NEW_ORDER_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const confirmed = useMemo(() => orders.filter((o) => o.status === 'confirmada'), [orders]);

  // Métricas del dashboard financiero: se calculan sobre pedidos confirmados
  // únicamente. Una "solicitud" pendiente todavía no es una venta real.
  const metrics = useMemo(() => {
    const now = new Date();
    const todayTotal = confirmed
      .filter((o) => o.confirmed_at && isSameDay(new Date(o.confirmed_at), now))
      .reduce((sum, o) => sum + o.total, 0);

    const weekConfirmed = confirmed.filter((o) => o.confirmed_at && isSameWeek(new Date(o.confirmed_at), now));
    const weekTotal = weekConfirmed.reduce((sum, o) => sum + o.total, 0);

    const prevWeekDate = new Date(now);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    const prevWeekTotal = confirmed
      .filter((o) => o.confirmed_at && isSameWeek(new Date(o.confirmed_at), prevWeekDate))
      .reduce((sum, o) => sum + o.total, 0);
    const weekChangePct =
      prevWeekTotal === 0 ? (weekTotal > 0 ? 100 : 0) : ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100;

    const monthConfirmed = confirmed.filter((o) => o.confirmed_at && isSameMonth(new Date(o.confirmed_at), now));
    const monthTotal = monthConfirmed.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = monthConfirmed.length ? monthTotal / monthConfirmed.length : 0;

    const pendingTotal = orders.filter((o) => o.status === 'pendiente').reduce((sum, o) => sum + o.total, 0);

    const productTotals = new Map<string, number>();
    monthConfirmed.forEach((o) =>
      (o.order_items || []).forEach((item) => {
        productTotals.set(item.product_name, (productTotals.get(item.product_name) || 0) + item.quantity);
      })
    );
    const topProducts = Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { todayTotal, weekTotal, weekChangePct, monthTotal, avgTicket, pendingTotal, topProducts };
  }, [confirmed, orders]);

  // Pipeline de filtros: búsqueda de texto -> estado -> rango de fechas.
  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.cedula || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const statusFiltered = useMemo(
    () => (filter === 'Todas' ? searchFiltered : searchFiltered.filter((o) => o.status === filter)),
    [searchFiltered, filter]
  );

  const dateFiltered = useMemo(() => {
    if (!dateFrom && !dateTo) return statusFiltered;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    return statusFiltered.filter((o) => {
      const created = new Date(o.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [statusFiltered, dateFrom, dateTo]);

  const hasDateFilter = !!dateFrom || !!dateTo;

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'pendiente').length, [orders]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleExpanded = dateFiltered.length > 0 && dateFiltered.every((o) => expanded.has(o.id));

  const toggleExpandAll = () => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (allVisibleExpanded) {
        dateFiltered.forEach((o) => next.delete(o.id));
      } else {
        dateFiltered.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const handleConfirm = async (id: string) => {
    setBusyId(id);
    try {
      await confirmOrder(id);
      await load();
    } catch (err) {
      alert('No se pudo confirmar: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta solicitud? Podés revertirlo después si fue un error.')) return;
    setBusyId(id);
    try {
      await cancelOrder(id);
      await load();
    } catch (err) {
      alert('No se pudo cancelar: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevert = async (id: string) => {
    setBusyId(id);
    try {
      await revertOrderToPending(id);
      await load();
    } catch (err) {
      alert('No se pudo revertir: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Cliente', 'Teléfono', 'Cédula', 'Estado', 'Total', 'Fecha', 'Método pago'];
    const rows = dateFiltered.map((o) => [
      o.id,
      o.customer_name,
      o.phone,
      o.cedula || '',
      STATUS_LABEL[o.status],
      o.total,
      new Date(o.created_at).toLocaleString('es-CO'),
      o.payment_method || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">Ventas</h1>
            {syncFailCount >= SYNC_FAIL_THRESHOLD ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-3 h-3" /> No se pudo sincronizar — reintentando
              </span>
            ) : isSyncing ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Sincronizando...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sincronizado
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {pendingCount > 0
              ? `${pendingCount} solicitud${pendingCount === 1 ? '' : 'es'} esperando confirmación`
              : 'Sin solicitudes pendientes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Total de ventas</span>
          <button
            onClick={markNotificationsSeen}
            title={unseenCount > 0 ? `${unseenCount} venta${unseenCount === 1 ? '' : 's'} nueva${unseenCount === 1 ? '' : 's'} sin revisar` : 'Sin notificaciones nuevas'}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unseenCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Descargar CSV
          </button>
        </div>
      </div>

      {/* Resumen financiero — calculado solo sobre ventas confirmadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Hoy
          </p>
          <p className="font-display font-bold text-lg dark:brightness-125" style={{ color: '#1E2568' }}>
            {formatPrice(metrics.todayTotal)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Esta semana
          </p>
          <p className="font-display font-bold text-lg dark:brightness-125" style={{ color: '#1E2568' }}>
            {formatPrice(metrics.weekTotal)}
          </p>
          <p className={`text-[10px] font-semibold mt-0.5 ${metrics.weekChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {metrics.weekChangePct >= 0 ? '+' : ''}
            {metrics.weekChangePct.toFixed(0)}% vs semana anterior
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Este mes
          </p>
          <p className="font-display font-bold text-lg dark:brightness-125" style={{ color: '#1E2568' }}>
            {formatPrice(metrics.monthTotal)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            <Receipt className="w-3.5 h-3.5" /> Ticket promedio
          </p>
          <p className="font-display font-bold text-lg dark:brightness-125" style={{ color: '#1E2568' }}>
            {formatPrice(metrics.avgTicket)}
          </p>
        </div>
        <div className="rounded-2xl p-4 shadow-xs border dark:brightness-110" style={{ backgroundColor: '#FFD10015', borderColor: '#FFD10060' }}>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
            <Clock className="w-3.5 h-3.5" /> Pendiente de confirmar
          </p>
          <p className="font-display font-bold text-lg text-amber-800">{formatPrice(metrics.pendingTotal)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            <Trophy className="w-3.5 h-3.5" /> Top 3 productos (mes)
          </p>
          {metrics.topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Sin ventas aún</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {metrics.topProducts.map(([name, qty]) => (
                  <tr key={name}>
                    <td className="py-0.5 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{name}</td>
                    <td className="py-0.5 text-right font-bold text-slate-900 dark:text-white">{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono, cédula o ID..."
          className="w-full text-sm pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 focus:border-brand-blue outline-none rounded-2xl transition-all shadow-xs"
        />
      </div>

      {/* Filtro de fecha */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <Calendar className="w-4 h-4" />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none shadow-xs"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">a</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none shadow-xs"
        />
        {hasDateFilter && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros por estado */}
      <div className="flex items-center gap-2 overflow-x-auto mb-4">
        {(
          [
            ['pendiente', `Pendientes${pendingCount ? ` (${pendingCount})` : ''}`],
            ['confirmada', 'Confirmadas'],
            ['cancelada', 'Canceladas'],
            ['Todas', 'Todas'],
          ] as [FilterValue, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition-colors ${
              filter === value
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}

        {dateFiltered.length > 0 && (
          <button
            onClick={toggleExpandAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 ml-auto shrink-0"
          >
            {allVisibleExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Contraer todo
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Expandir todo
              </>
            )}
          </button>
        )}
      </div>

      {loading && <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">Cargando ventas...</div>}
      {error && !loading && (
        <div className="text-center py-16 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-xs overflow-hidden">
          {dateFiltered.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">No hay solicitudes en esta vista.</div>
          ) : (
            dateFiltered.map((o) => {
              const isExpanded = expanded.has(o.id);
              return (
                <div key={o.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <button
                    onClick={() => toggleExpand(o.id)}
                    className="flex items-center gap-3 w-full text-left px-4 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{o.customer_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(o.created_at)} · {(o.order_items || []).length} producto
                        {(o.order_items || []).length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border shrink-0 dark:brightness-110 ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <p className="font-display font-bold text-sm text-slate-900 dark:text-white shrink-0 w-24 text-right">
                      {formatPrice(o.total)}
                    </p>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 -mt-1">
                      <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-4 space-y-2">
                        {(o.order_items || []).map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-xs">
                            <img
                              src={getItemImage(item, productsMap)}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.webp';
                              }}
                            />
                            <span className="flex-1 min-w-0 text-slate-600 dark:text-slate-300 truncate">
                              {item.product_name} · {item.colorway} · Talla {item.size} × {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                              {formatPrice(item.price_at_time * item.quantity)}
                            </span>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{o.phone}</span>
                          {o.city && <span>· {o.city}</span>}
                          {o.cedula && <span>· CC {o.cedula}</span>}
                          {o.payment_method && (
                            <span>· {PAYMENT_METHOD_LABEL[o.payment_method] || o.payment_method}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <a
                            href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/70"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Contactar
                          </a>

                          {o.status === 'pendiente' && (
                            <>
                              <button
                                disabled={busyId === o.id}
                                onClick={() => handleConfirm(o.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-blue text-white hover:bg-slate-950 disabled:opacity-60"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar venta
                              </button>
                              <button
                                disabled={busyId === o.id}
                                onClick={() => handleCancel(o.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-950/70 disabled:opacity-60"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          )}

                          {o.status !== 'pendiente' && (
                            <button
                              disabled={busyId === o.id}
                              onClick={() => handleRevert(o.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Volver a pendiente
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notificaciones de venta nueva: solo visuales, sin sonido — se
          detectan comparando los IDs de órdenes ya vistos contra los que
          trae cada poll silencioso. */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {newOrderToasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white">¡Venta nueva!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.customerName}</p>
                <p className="text-xs font-semibold text-brand-blue dark:text-brand-sky mt-0.5">{formatPrice(t.total)}</p>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
