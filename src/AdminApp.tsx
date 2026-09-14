import { useEffect, useState } from 'react';
import { loadStoredSession, setSession, clearSession } from './lib/supabase';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminSettings from './components/admin/AdminSettings';
import AdminTestimonials from './components/admin/AdminTestimonials';
import { LayoutGrid, ShoppingBag, Settings, MessageSquareQuote, LogOut, ExternalLink } from 'lucide-react';

// =========================================================================
// ADMIN APP — punto de entrada del panel de administración de Trespa Store
// =========================================================================
// Se monta en lugar de la tienda (<App />) cuando la URL tiene #admin.
// La sesión (access token + refresh token) se guarda en localStorage y se
// renueva sola cuando vence (ver lib/supabase.ts) — no hace falta loguearse
// de nuevo cada hora.

type Tab = 'productos' | 'ventas' | 'configuracion' | 'testimonios';

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [tab, setTab] = useState<Tab>('productos');

  useEffect(() => {
    setIsAuthenticated(loadStoredSession());
    setCheckedStorage(true);
  }, []);

  const handleLoginSuccess = (accessToken: string, refreshToken: string) => {
    setSession(accessToken, refreshToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  if (!checkedStorage) return null; // evita parpadeo mientras se revisa localStorage

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <AdminLogin onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'productos', label: 'Productos', icon: LayoutGrid },
    { id: 'ventas', label: 'Ventas', icon: ShoppingBag },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'testimonios', label: 'Testimonios', icon: MessageSquareQuote },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Barra superior con pestañas */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-4 text-xs font-bold uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue px-3 py-2 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver tienda
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {tab === 'productos' && <AdminDashboard />}
      {tab === 'ventas' && <AdminOrders />}
      {tab === 'configuracion' && <AdminSettings />}
      {tab === 'testimonios' && <AdminTestimonials />}
    </div>
  );
}
