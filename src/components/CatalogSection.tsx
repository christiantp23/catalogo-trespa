import { Filter, ChevronDown, X, BookImage, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import FilterPanelBody from './FilterPanelBody';

interface CatalogFilters {
  selectedCategory: string;
  selectedBrand: string;
  selectedGender: 'Todos' | 'Dama' | 'Caballero' | 'Unisex';
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  onlyDiscounts: boolean;
  // Derivado de priceInitialized/minPrice/maxPrice/catalogMaxPrice en App —
  // se pasa ya calculado porque priceInitialized en sí no hace falta acá.
  isPriceFiltered: boolean;
  CATEGORIES: string[];
  BRANDS: string[];
  catalogMaxPrice: number;
}

interface CatalogFilterActions {
  setSelectedCategory: (v: string) => void;
  setSelectedBrand: (v: string) => void;
  setSelectedGender: (v: 'Todos' | 'Dama' | 'Caballero' | 'Unisex') => void;
  setMinPrice: (v: number) => void;
  setMaxPrice: (v: number) => void;
  setOnlyDiscounts: (v: boolean) => void;
  resetFilters: () => void;
}

interface CatalogPagination {
  visibleCount: number;
  // Acepta también la forma funcional (prev => prev + N) porque así la usa
  // el botón "Cargar más" — no queríamos cambiar esa lógica al moverla.
  setVisibleCount: (v: number | ((prev: number) => number)) => void;
  PRODUCTS_PER_PAGE: number;
}

interface CatalogSectionProps {
  products: Product[];
  sortedProducts: Product[];
  displayedProducts: Product[];
  favoriteIds: string[];
  isCatalogLoading: boolean;
  productsError: string | null;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (open: boolean) => void;
  filters: CatalogFilters;
  filterActions: CatalogFilterActions;
  pagination: CatalogPagination;
  onAddToCart: (product: Product, size: number, color: string) => void;
  onToggleFavorite: (productId: string) => void;
  onOpenSizeGuide: () => void;
}

// Catálogo principal: título/resumen, banner de Telegram/WhatsApp, panel de
// filtros (desktop) + botón flotante y drawer (mobile), grid de productos con
// skeleton/estado vacío, y paginación "Cargar más". Extraído tal cual de
// App.tsx — la lógica de filtrado/orden/paginación en sí sigue viviendo en
// App, acá solo se recibe el resultado ya calculado.
export default function CatalogSection({
  products,
  sortedProducts,
  displayedProducts,
  favoriteIds,
  isCatalogLoading,
  productsError,
  isFilterDrawerOpen,
  setIsFilterDrawerOpen,
  filters,
  filterActions,
  pagination,
  onAddToCart,
  onToggleFavorite,
  onOpenSizeGuide,
}: CatalogSectionProps) {
  const {
    selectedCategory,
    selectedBrand,
    selectedGender,
    minPrice,
    maxPrice,
    searchQuery,
    onlyDiscounts,
    isPriceFiltered,
    CATEGORIES,
    BRANDS,
    catalogMaxPrice,
  } = filters;
  const {
    setSelectedCategory,
    setSelectedBrand,
    setSelectedGender,
    setMinPrice,
    setMaxPrice,
    setOnlyDiscounts,
    resetFilters,
  } = filterActions;
  const { visibleCount, setVisibleCount, PRODUCTS_PER_PAGE } = pagination;

  const hasActiveFilters =
    selectedCategory !== 'Todos' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyDiscounts || isPriceFiltered;
  const hasActiveFiltersOrSearch = hasActiveFilters || searchQuery !== '';

  return (
    <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

      {/* Título y resumen de estadísticas */}
      <div className="mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Catálogo de <span className="text-brand-blue">Modelos</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Mostrando {sortedProducts.length} de {products.length} referencias de primera calidad
        </p>
      </div>

            {/* Banner Informativo Trespa Store - Canal de Telegram & WhatsApp */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[24px] p-4 sm:p-5 mb-8 overflow-hidden shadow-lg border border-white/5">
        {/* Círculo decorativo */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
              <BookImage className="w-3 h-3 text-brand-yellow" />
              Catálogo Exclusivo Completo
            </div>
            <h3 className="font-display text-lg sm:text-xl font-black tracking-tight text-white uppercase">
              ¿Buscas más modelos o una referencia específica?
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed font-normal">
              En esta web exhibimos solo una selección de nuestros modelos más destacados. Contamos con cientos de referencias adicionales esperando por ti. ¡Explora todos los estilos en nuestro canal de Telegram o escríbenos a WhatsApp para consultar por ese par que tanto quieres!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto shrink-0">
            <a
              href="https://telegram.me/+k6-HnPX2z6o1NWEx"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center px-5 py-2.5 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white font-extrabold rounded-xl shadow-md shadow-[#229ED9]/20 transition-all text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Ver Catálogo en Telegram
            </a>
            <a
              href="https://wa.me/573008165725?text=Hola,%20quiero%20ver%20el%20cat%C3%A1logo%20completo%20de%20tenis"
              target="_blank"
              rel="noopener noreferrer"
className="w-full sm:w-auto text-center px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-extrabold rounded-xl transition-all text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs"              >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Directo
            </a>
          </div>
        </div>
      </div>

      {/* Panel de filtros (desktop / tablet en adelante — md+). En mobile
          se reemplaza por el botón flotante + drawer definidos más abajo,
          para no ocupar la pantalla completa con el panel fijo. */}
      <div className="hidden md:block bg-white border border-slate-100 rounded-[30px] p-6 mb-10 shadow-xs">
        {/* Encabezado del Panel */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-900" />
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider">
              Filtros del Catálogo
            </h3>
            {hasActiveFilters && (
              <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                Filtros Activos
              </span>
            )}
          </div>
          {hasActiveFiltersOrSearch && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        <FilterPanelBody
          BRANDS={BRANDS}
          CATEGORIES={CATEGORIES}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
          onlyDiscounts={onlyDiscounts}
          setOnlyDiscounts={setOnlyDiscounts}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          catalogMaxPrice={catalogMaxPrice}
        />
      </div>

      {/* Botón flotante de filtros — solo mobile (md:hidden). Se ubica
          abajo a la izquierda para no superponerse con el stack de
          WhatsApp/Telegram, que están fijos abajo a la derecha. */}
      <button
        type="button"
        onClick={() => setIsFilterDrawerOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-xl active:scale-95 transition-transform"
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-brand-yellow shrink-0" />
        )}
      </button>

      {/* Drawer de filtros (bottom sheet) — solo mobile */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-900" />
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider">
                    Filtros del Catálogo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
                  aria-label="Cerrar filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-5 flex-1">
                {hasActiveFiltersOrSearch && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mb-4 text-[11px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Limpiar Filtros
                  </button>
                )}
                <FilterPanelBody
                  BRANDS={BRANDS}
                  CATEGORIES={CATEGORIES}
                  selectedBrand={selectedBrand}
                  setSelectedBrand={setSelectedBrand}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedGender={selectedGender}
                  setSelectedGender={setSelectedGender}
                  onlyDiscounts={onlyDiscounts}
                  setOnlyDiscounts={setOnlyDiscounts}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  catalogMaxPrice={catalogMaxPrice}
                />
              </div>

              <div className="px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Ver resultados ({sortedProducts.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cuadrícula de visualización de productos */}
      <AnimatePresence mode="popLayout">
        {isCatalogLoading ? (
          <div className="space-y-12">
          <motion.div
          key="catalog-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: Math.min(displayedProducts.length || 8, 8) }).map((_, idx) => (
                <ProductSkeleton key={`skeleton-${idx}`} />
              ))}
            </motion.div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <motion.div
            key="catalog-empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-20 px-4 bg-white border border-slate-100 rounded-[32px] shadow-xs max-w-xl mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4 border border-dashed border-slate-200">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
              {productsError ? 'No se pudo cargar el catálogo' : 'No encontramos coincidencias'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              {productsError
                ? 'Hubo un problema de conexión con el catálogo. Revisa tu conexión a internet e intenta recargar la página.'
                : 'No hay productos que cumplan con los filtros de búsqueda aplicados. Intenta restablecer los filtros para ver todo el inventario.'}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="py-3 px-6 rounded-2xl bg-slate-950 hover:bg-brand-blue text-white text-xs font-bold tracking-wider uppercase transition-colors"
            >
              Mostrar Todos los Tenis
            </button>
          </motion.div>
        ) : (
          <div className="space-y-12">
          <motion.div
            key="catalog-grid"
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
          {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenSizeGuide={onOpenSizeGuide}
                isFavorite={favoriteIds.includes(product.id)} // Nuevo: enviamos si este producto está marcado como favorito
                onToggleFavorite={onToggleFavorite} // Nuevo: enviamos la acción para añadir o quitar de favoritos
              />
            ))}
          </motion.div>
          {/* Botón de Cargar Más para limitar la visualización y mejorar la velocidad de carga inicial */}
            {visibleCount < sortedProducts.length && (
              <div className="flex flex-col items-center justify-center pt-4">
                <p className="text-xs text-slate-500 mb-3.5 font-medium">
                  Mostrando <span className="font-bold text-slate-800">{displayedProducts.length}</span> de <span className="font-bold text-slate-800">{sortedProducts.length}</span> referencias de tenis
                </p>
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)}
                  className="py-3.5 px-8 rounded-2xl bg-slate-900 hover:bg-brand-blue text-white text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-md shadow-slate-200/80 hover:shadow-brand-blue/15 flex items-center gap-2 cursor-pointer select-none"
                >
                  <span>Cargar más referencias</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
