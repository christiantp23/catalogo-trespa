import { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, Search, Heart, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

// =========================================================================
// INTERFAZ DE PROPIEDADES DE NAVBAR (NavbarProps)
// =========================================================================
// Añadimos dos nuevas propiedades para que el menú de navegación conozca favoritos:
// - wishlistItemsCount: Indica el número de productos guardados en favoritos.
// - onWishlistOpen: Función que se ejecuta al hacer clic en el corazón del navbar
//   para abrir la barra lateral de favoritos.
interface NavbarProps {
  cartItemsCount: number;
  onCartOpen: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenInfo?: (tab: 'tallas' | 'politicas' | 'pagos' | 'transportes') => void;
  wishlistItemsCount: number; // Nuevo: contador de favoritos
  onWishlistOpen: () => void; // Nuevo: acción para abrir favoritos
  products: Product[]; // Catálogo completo, para armar las sugerencias del buscador
  onSelectSuggestion: (product: Product) => void; // Al elegir una sugerencia
}

export default function Navbar({
  cartItemsCount,
  onCartOpen,
  searchQuery,
  onSearchChange,
  onOpenInfo,
  wishlistItemsCount, // Recibimos el contador
  onWishlistOpen,     // Recibimos la función de apertura
  products,
  onSelectSuggestion,
}: NavbarProps) {
  // =========================================================================
  // SUGERENCIAS DE BÚSQUEDA (dropdown bajo el buscador)
  // =========================================================================
  // Se calculan a partir de "products" (catálogo completo, no el ya filtrado
  // por otros filtros) para que el cliente pueda encontrar cualquier
  // producto por nombre, marca o descripción a partir de 2 caracteres.
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [products, searchQuery]);

  // Qué caja de búsqueda tiene el dropdown abierto (desktop o mobile son dos
  // inputs distintos en el DOM). null = cerrado.
  const [openBox, setOpenBox] = useState<'desktop' | 'mobile' | null>(null);
  const desktopBoxRef = useRef<HTMLDivElement>(null);
  const mobileBoxRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // En mobile el buscador vive detrás de un ícono de lupa en el navbar: se
  // abre/cierra con este estado en vez de mostrarse siempre como fila fija.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (openBox === 'desktop' && desktopBoxRef.current && !desktopBoxRef.current.contains(target)) {
        setOpenBox(null);
      }
      if (openBox === 'mobile' && mobileBoxRef.current && !mobileBoxRef.current.contains(target)) {
        setOpenBox(null);
      }
      if (mobileSearchOpen && mobileBoxRef.current && !mobileBoxRef.current.contains(target)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openBox, mobileSearchOpen]);

  // Al abrir el buscador mobile, enfocar el input automáticamente.
  useEffect(() => {
    if (mobileSearchOpen) mobileInputRef.current?.focus();
  }, [mobileSearchOpen]);

  const handleSelect = (product: Product) => {
    onSelectSuggestion(product);
    setOpenBox(null);
    setMobileSearchOpen(false);
  };

  const renderSuggestions = (positionClass: string) => (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className={`absolute top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 ${positionClass}`}
        >
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{p.brand}</p>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fila principal: logo + buscador (solo desktop) + acciones */}
        <div className="flex items-center justify-between h-16 md:h-20 gap-3 md:gap-4">

          {/* Logo / Brand */}
          <a href="/" className="flex items-baseline gap-1.5 group shrink-0">
            <img
              src="/logo-trimmed.webp"
              alt="TRESPA STORE"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Buscador (Desktop): centrado entre el logo y las acciones */}
          <div ref={desktopBoxRef} className="relative flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setOpenBox('desktop')}
                placeholder="Buscar tenis..."
                className="w-full text-xs font-medium pl-10 pr-4 py-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none rounded-2xl transition-all placeholder:text-slate-400"
              />
            </div>
            {openBox === 'desktop' && renderSuggestions('left-0 right-0')}
          </div>

          {/* Acciones: mismos botones en mobile y desktop, solo cambia si
              llevan etiqueta de texto junto al ícono (desktop) o no
              (mobile, para no saturar la fila). */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Lupa de búsqueda (solo mobile/tablet): abre/cierra el panel
                de búsqueda debajo del navbar. En desktop no se muestra
                porque el buscador ya está siempre visible en la fila. */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className={`md:hidden relative w-11 h-11 rounded-2xl border transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                mobileSearchOpen
                  ? 'border-brand-blue text-brand-blue bg-brand-blue/5'
                  : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Nosotros: ícono de grupo de personas, más representativo
                que el ícono de información genérico que tenía antes. */}
            {onOpenInfo && (
              <button
                type="button"
                onClick={() => onOpenInfo('politicas')}
                className="flex items-center gap-1.5 h-11 md:h-12 px-3 md:px-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-blue transition-all shadow-xs cursor-pointer"
                title="Nosotros"
              >
                <Users className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Nosotros</span>
              </button>
            )}

            {/* Favoritos */}
            <motion.button
              id="wishlist-trigger-btn"
              type="button"
              onClick={onWishlistOpen}
              whileTap={{ scale: 0.95 }}
              className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-rose-500 transition-all shadow-xs cursor-pointer"
              title="Ver favoritos"
            >
              <Heart className={`w-5 h-5 ${wishlistItemsCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistItemsCount > 0 && (
                <motion.span
                  key={wishlistItemsCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {wishlistItemsCount}
                </motion.span>
              )}
            </motion.button>

            {/* Carrito */}
            <motion.button
              id="cart-trigger-btn"
              type="button"
              onClick={onCartOpen}
              whileTap={{ scale: 0.95 }}
              className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-brand-blue transition-all shadow-xs"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <motion.span
                  key={cartItemsCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-brand-blue text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Buscador (Mobile/Tablet): panel colapsable que se abre con la
            lupa de la fila de acciones, en vez de ocupar espacio fijo. */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              ref={mobileBoxRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="relative md:hidden"
            >
              <div className="relative pb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setOpenBox('mobile')}
                  placeholder="Buscar tenis..."
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-100 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none rounded-2xl transition-all placeholder:text-slate-400"
                />
              </div>
              {openBox === 'mobile' && renderSuggestions('left-0 right-0')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
