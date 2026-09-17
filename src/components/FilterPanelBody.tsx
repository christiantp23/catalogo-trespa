import { Filter, TrendingUp, Users, Percent, DollarSign, Venus, Mars, VenusAndMars, Flame } from 'lucide-react';

// =========================================================================
// CONTENIDO DEL PANEL DE FILTROS (Marca / Categoría / Colección / Ofertas / Precio)
// =========================================================================
// Extraído de App.tsx tal cual. Se usa dos veces a la vez desde
// CatalogSection.tsx (una copia inline en desktop y otra dentro del drawer de
// filtros en mobile) sin perder el foco de los inputs numéricos de precio ni
// duplicar la lógica de filtrado, porque es siempre la misma función/
// componente (misma identidad para React).
interface FilterPanelBodyProps {
  BRANDS: string[];
  CATEGORIES: string[];
  selectedBrand: string;
  setSelectedBrand: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedGender: 'Todos' | 'Dama' | 'Caballero' | 'Unisex';
  setSelectedGender: (v: 'Todos' | 'Dama' | 'Caballero' | 'Unisex') => void;
  onlyDiscounts: boolean;
  setOnlyDiscounts: (v: boolean) => void;
  minPrice: number;
  setMinPrice: (v: number) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  catalogMaxPrice: number;
}

// Formateo de precios en pesos colombianos, usado solo acá (rango de precio
// del panel de filtros) — no depende de ningún estado de App.
const formatPriceCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function FilterPanelBody({
  BRANDS,
  CATEGORIES,
  selectedBrand,
  setSelectedBrand,
  selectedCategory,
  setSelectedCategory,
  selectedGender,
  setSelectedGender,
  onlyDiscounts,
  setOnlyDiscounts,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  catalogMaxPrice,
}: FilterPanelBodyProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Columna 1: Marca */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Marca</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={`text-[11px] py-2 px-2 rounded-xl border text-center transition-all duration-200 truncate cursor-pointer font-medium ${
                selectedBrand === brand
                  ? 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Columna 2: Categoría / Estilo */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Categoría</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`text-[11px] py-2 px-2 rounded-xl border text-center transition-all duration-200 truncate cursor-pointer font-medium ${
                selectedCategory === category
                  ? 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Columna 3: Colección por Género */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Colección</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'Todos', label: 'Todos', Icon: Users, activeClass: 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs' },
            { id: 'Dama', label: 'Dama', Icon: Venus, activeClass: 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs' },
            { id: 'Caballero', label: 'Caballero', Icon: Mars, activeClass: 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs' },
            { id: 'Unisex', label: 'Unisex', Icon: VenusAndMars, activeClass: 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedGender(item.id as 'Todos' | 'Dama' | 'Caballero' | 'Unisex')}
              className={`text-[11px] py-2 px-1.5 rounded-xl border text-center transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer truncate font-medium ${
                selectedGender === item.id
                  ? item.activeClass
                  : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <item.Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Columna 4: Ofertas y Descuentos */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <Percent className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ofertas</span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOnlyDiscounts(false)}
            className={`text-[11px] py-2.5 px-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer font-medium ${
              !onlyDiscounts
                ? 'bg-brand-blue border-brand-blue text-white font-bold shadow-xs'
                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos los productos
          </button>
          <button
            type="button"
            onClick={() => setOnlyDiscounts(true)}
            className={`text-[11px] py-2.5 px-3.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-1.5 cursor-pointer font-medium ${
              onlyDiscounts
                ? 'bg-brand-yellow border-brand-yellow text-slate-900 font-bold shadow-xs'
                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" /> En Oferta / Descuento
          </button>
        </div>
      </div>

      {/* Columna 5: Rango de precio */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Precio</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Desde $
            </label>
            <input
              type="number"
              min={0}
              max={catalogMaxPrice}
              value={minPrice}
              onChange={(e) => {
                const v = Math.max(0, Math.min(Number(e.target.value) || 0, maxPrice));
                setMinPrice(v);
              }}
              className="w-full text-[11px] px-2 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 outline-none focus:border-brand-blue"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Hasta $
            </label>
            <input
              type="number"
              min={0}
              max={catalogMaxPrice}
              value={maxPrice}
              onChange={(e) => {
                const v = Math.min(catalogMaxPrice, Math.max(Number(e.target.value) || 0, minPrice));
                setMaxPrice(v);
              }}
              className="w-full text-[11px] px-2 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Slider de rango: dos <input type="range"> superpuestos.
            pointer-events se desactiva en el input completo y se reactiva
            solo en el thumb, para que ambos sean arrastrables de forma
            independiente sin que uno le robe los clics al otro. */}
        <div className="relative h-5 flex items-center">
          <div className="absolute left-0 right-0 h-1.5 bg-slate-100 rounded-full" />
          <div
            className="absolute h-1.5 bg-brand-blue rounded-full"
            style={{
              left: `${catalogMaxPrice > 0 ? (minPrice / catalogMaxPrice) * 100 : 0}%`,
              right: `${catalogMaxPrice > 0 ? 100 - (maxPrice / catalogMaxPrice) * 100 : 0}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={catalogMaxPrice || 1}
            value={minPrice}
            onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <input
            type="range"
            min={0}
            max={catalogMaxPrice || 1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          {formatPriceCOP(minPrice)} — {formatPriceCOP(maxPrice)}
        </p>
      </div>
    </div>
  );
}
