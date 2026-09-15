import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loadStoredSession, setSession, clearSession } from './lib/supabase';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminSettings from './components/admin/AdminSettings';
import AdminTestimonials from './components/admin/AdminTestimonials';
import { LayoutGrid, ShoppingBag, Settings, MessageSquareQuote, LogOut, ExternalLink, Menu, X, HelpCircle, Sun, Moon } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Modo oscuro: preferencia propia del panel admin (no afecta el sitio
  // público), persistida en localStorage para que se mantenga entre sesiones.
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('admin_dark_mode') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setIsAuthenticated(loadStoredSession());
    setCheckedStorage(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('admin_dark_mode', darkMode ? '1' : '0');
    } catch {
      // si localStorage falla (modo privado, etc.), simplemente no persiste
    }
  }, [darkMode]);

  // Atajos de teclado: Ctrl/Cmd+1..4 cambian de pestaña. Se desactivan si el
  // foco está en un input/textarea/select para no interferir con la escritura.
  useEffect(() => {
    const SHORTCUT_TABS: Record<string, Tab> = {
      '1': 'productos',
      '2': 'ventas',
      '3': 'configuracion',
      '4': 'testimonios',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

      const nextTab = SHORTCUT_TABS[e.key];
      if (!nextTab) return;
      e.preventDefault();
      setTab(nextTab);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans ${darkMode ? 'dark' : ''}`}>
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
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans ${darkMode ? 'dark' : ''}`}>
      {/* Barra superior: logo + título, navegación de escritorio (pestañas +
          acciones, inline, igual que siempre) y en mobile un botón de menú
          hamburguesa que despliega esas mismas pestañas/acciones en una
          lista vertical. Así la fila superior nunca tiene más contenido del
          que entra en una línea, sin importar el ancho de pantalla — se
          reemplaza el intento anterior (flex-wrap + orden de filas), que
          seguía dependiendo de que todo cupiera horizontalmente. */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo + título del panel. logo.webp es un lienzo cuadrado con
              mucho margen en blanco alrededor de la marca — usamos
              logo-trimmed.webp (mismo logo, recortado al contenido real,
              sin el margen sobrante) para que se vea nítido y de buen
              tamaño al escalarlo por altura, sin necesitar el recorte por
              CSS que hacía falta antes con el original cuadrado. */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <img
              src="/logo-trimmed.webp"
              alt="Trespa Store"
              className="h-9 w-auto object-contain shrink-0"
            />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
            <h1 className="text-base font-bold text-blue-900 dark:text-white whitespace-nowrap">Panel Admin</h1>
          </div>

          {/* Navegación de escritorio (pestañas + acciones): oculta en
              mobile, igual que estaba antes de este cambio. */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-4 text-xs font-bold uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'border-brand-blue text-brand-blue dark:border-brand-sky dark:text-brand-sky'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:text-slate-400 dark:hover:text-brand-sky dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div
              className="relative"
              onMouseEnter={() => setShowShortcuts(true)}
              onMouseLeave={() => setShowShortcuts(false)}
            >
              <button
                type="button"
                onClick={() => setShowShortcuts((v) => !v)}
                aria-label="Ver atajos de teclado"
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-slate-50 dark:text-slate-400 dark:hover:text-brand-sky dark:hover:bg-slate-800 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showShortcuts && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-lg p-3 z-40"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Atajos de teclado
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center justify-between">
                        <span>Productos</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold">Ctrl+1</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Ventas</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold">Ctrl+2</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Configuración</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold">Ctrl+3</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Testimonios</span>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold">Ctrl+4</kbd>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <a
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue dark:text-slate-400 dark:hover:text-brand-sky px-3 py-2 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver tienda
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>

          {/* Botón de menú hamburguesa: solo mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menú desplegable mobile: pestañas en lista vertical + acciones.
            Nunca puede desbordar el ancho de pantalla porque cada ítem es
            un botón de ancho completo, no una fila horizontal. */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTab(t.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-colors ${
                        tab === t.id
                          ? 'bg-brand-blue/10 text-brand-blue dark:bg-brand-sky/10 dark:text-brand-sky'
                          : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {t.label}
                    </button>
                  );
                })}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => setDarkMode((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Modo claro' : 'Modo oscuro'}
                </button>
                <a
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Ver tienda
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {tab === 'productos' && <AdminDashboard />}
      {tab === 'ventas' && <AdminOrders />}
      {tab === 'configuracion' && <AdminSettings />}
      {tab === 'testimonios' && <AdminTestimonials />}
    </div>
  );
}
