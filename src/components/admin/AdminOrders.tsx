import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  DbOrder,
  OrderStatus,
  fetchOrders,
  confirmOrder,
  cancelOrder,
  revertOrderToPending,
} from '../../lib/orders';

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

type FilterValue = OrderStatus | 'Todas';

export default function AdminOrders() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('pendiente');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmed = useMemo(() => orders.filter((o) => o.status === 'confirmada'), [orders]);

  // Métricas del dashboard financiero: se calculan sobre pedidos confirmados
  // únicamente. Una "solicitud" pendiente todavía no es una venta real.
  const metrics = useMemo(() => {
    const now = new Date();
    const todayTotal = confirmed
      .filter((o) => o.confirmed_at && isSameDay(new Date(o.confirmed_at), now))
      .reduce((sum, o) => sum + o.total, 0);
    const monthTotal = confirmed
      .filter((o) => o.confirmed_at && isSameMonth(new Date(o.confirmed_at), now))
      .reduce((sum, o) => sum + o.total, 0);
    const avgTicket = confirmed.length ? confirmed.reduce((sum, o) => sum + o.total, 0) / confirmed.length : 0;

    const productTotals = new Map<string, number>();
    confirmed.forEach((o) =>
      (o.order_items || []).forEach((item) => {
        productTotals.set(item.product_name, (productTotals.get(item.product_name) || 0) + item.quantity);
      })
    );
    const topProducts = Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { todayTotal, monthTotal, avgTicket, topProducts };
  }, [confirmed]);

  const filtered = useMemo(
    () => (filter === 'Todas' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'pendiente').length, [orders]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-lg text-slate-900 leading-tight">Ventas</h1>
        <p className="text-xs text-slate-400">
          {pendingCount > 0
            ? `${pendingCount} solicitud${pendingCount === 1 ? '' : 'es'} esperando confirmación`
            : 'Sin solicitudes pendientes'}
        </p>
      </div>

      {/* Resumen financiero — calculado solo sobre ventas confirmadas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Hoy
          </p>
          <p className="font-display font-bold text-lg text-slate-900">{formatPrice(metrics.todayTotal)}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Este mes
          </p>
          <p className="font-display font-bold text-lg text-slate-900">{formatPrice(metrics.monthTotal)}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Receipt className="w-3.5 h-3.5" /> Ticket promedio
          </p>
          <p className="font-display font-bold text-lg text-slate-900">{formatPrice(metrics.avgTicket)}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Trophy className="w-3.5 h-3.5" /> Top producto
          </p>
          <p className="font-semibold text-xs text-slate-900 truncate">
            {metrics.topProducts[0] ? `${metrics.topProducts[0][0]} (${metrics.topProducts[0][1]})` : 'Sin ventas aún'}
          </p>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 overflow-x-auto mb-4">
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
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-16 text-sm text-slate-400">Cargando ventas...</div>}
      {error && !loading && (
        <div className="text-center py-16 text-sm text-rose-600 bg-rose-50 rounded-2xl border border-rose-100">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-slate-100 rounded-[28px] shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400">No hay solicitudes en esta vista.</div>
          ) : (
            filtered.map((o) => {
              const isExpanded = expanded.has(o.id);
              return (
                <div key={o.id} className="border-b border-slate-50 last:border-0">
                  <button
                    onClick={() => toggleExpand(o.id)}
                    className="flex items-center gap-3 w-full text-left px-4 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{o.customer_name}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(o.created_at)} · {(o.order_items || []).length} producto
                        {(o.order_items || []).length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border shrink-0 ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <p className="font-display font-bold text-sm text-slate-900 shrink-0 w-24 text-right">
                      {formatPrice(o.total)}
                    </p>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 -mt-1">
                      <div className="bg-slate-50/60 rounded-2xl p-4 space-y-2">
                        {(o.order_items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                              {item.product_name} · {item.colorway} · Talla {item.size} × {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatPrice(item.price_at_time * item.quantity)}
                            </span>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{o.phone}</span>
                          {o.city && <span>· {o.city}</span>}
                          {o.cedula && <span>· CC {o.cedula}</span>}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <a
                            href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-60"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          )}

                          {o.status !== 'pendiente' && (
                            <button
                              disabled={busyId === o.id}
                              onClick={() => handleRevert(o.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
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
    </div>
  );
}
