import { useState, useEffect, useMemo } from 'react';
import { Truck, TrendingUp, Filter, Heart, ArrowUpRight, CheckCircle, Percent, ChevronDown, Instagram, Facebook, BookImage, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, ToastNotification} from './types';
import { fetchProducts } from './lib/products';
import { useSiteSettings } from './lib/settings';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductSkeleton from './components/ProductSkeleton';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import CheckoutModal from './components/CheckoutModal';
import FloatingWhatsapp from './components/FloatingWhatsapp';
import FloatingTelegram from './components/FloatingTelegram';
import InfoModals from './components/InfoModals';
import TestimonialsSection from './components/TestimonialsSection'; // Nuevo: Importamos la sección de testimonios de clientes (WhatsApp chats)
import ToastContainer from './components/ToastContainer';
import SplashScreen from './components/SplashScreen';
//import FloatingCatalogStats from './components/FloatingCatalogStats';

// =========================================================================
// CONTENIDO DEL PANEL DE FILTROS (Marca / Categoría / Colección / Ofertas / Precio)
// =========================================================================
// Se define FUERA de App() a propósito: así React lo trata como el mismo
// componente en cada render (misma identidad de función) y puede montarse
// dos veces a la vez sin remontarse — una copia inline en desktop y otra
// dentro del drawer de filtros en mobile — sin perder el foco de los inputs
// numéricos de precio ni duplicar la lógica de filtrado.
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
  formatPriceCOP: (v: number) => string;
}

function FilterPanelBody({
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
  formatPriceCOP,
}: FilterPanelBodyProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Columna 1: Marca */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Marca</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={`text-[11px] py-2 px-2 rounded-xl border text-center transition-all duration-200 truncate cursor-pointer font-medium ${
                selectedBrand === brand
                  ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoría</span>
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
          <span className="text-xs">👥</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colección</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'Todos', label: 'Todos', emoji: '👥', activeClass: 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' },
            { id: 'Dama', label: 'Dama', emoji: '🌸', activeClass: 'bg-pink-500 border-pink-500 text-white font-bold shadow-xs' },
            { id: 'Caballero', label: 'Caballero', emoji: '⚡', activeClass: 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' },
            { id: 'Unisex', label: 'Unisex', emoji: '👥', activeClass: 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs' },
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
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Columna 4: Ofertas y Descuentos */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <Percent className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ofertas</span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOnlyDiscounts(false)}
            className={`text-[11px] py-2.5 px-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer font-medium ${
              !onlyDiscounts
                ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏷️ Todos los productos
          </button>
          <button
            type="button"
            onClick={() => setOnlyDiscounts(true)}
            className={`text-[11px] py-2.5 px-3.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-1.5 cursor-pointer font-medium ${
              onlyDiscounts
                ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs'
                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 En Oferta / Descuento
          </button>
        </div>
      </div>

      {/* Columna 5: Rango de precio */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
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
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
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

        <p className="text-[10px] text-slate-400 text-center">
          {formatPriceCOP(minPrice)} — {formatPriceCOP(maxPrice)}
        </p>
      </div>
    </div>
  );
}


export default function App() {
  const { bannerText } = useSiteSettings();
  // ==========================================
  // 1. PERSISTENCIA LOCAL DEL CARRITO (localStorage)
  // ==========================================
  // En React, "useState" es un Hook que define un estado (una variable que React vigila).
  // Cuando este estado cambia, React automáticamente redibuja (re-renderiza) la pantalla para mostrar los datos actualizados.
  //
  // Aquí usamos "Lazy Initialization" (inicialización diferida): en lugar de pasar un valor por defecto como [],
  // le pasamos una función callback () => { ... }. Esto hace que el código dentro se ejecute UNA SOLA VEZ
  // cuando el componente se monta por primera vez, evitando leer el disco (localStorage) innecesariamente en cada render.
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      // Intentamos recuperar la información guardada en el almacenamiento del navegador bajo la clave 'trespa_cart'
      const saved = localStorage.getItem('trespa_cart');

      // localStorage solo guarda cadenas de texto plano (string). Por eso:
      // - Si hay datos ("saved"), usamos "JSON.parse(saved)" para convertir esa cadena de texto de vuelta a un arreglo de objetos de JavaScript.
      // - Si no hay datos guardados previamente, retornamos un arreglo vacío [] por defecto.
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      // Si por alguna razón ocurre un error (por ejemplo, datos corruptos en el navegador), devolvemos un arreglo vacío
      return [];
    }
  });

  // ==========================================
  // 2. PERSISTENCIA LOCAL DE FAVORITOS (Wishlist)
  // ==========================================
  // Creamos un estado "favoriteIds" que guardará un arreglo de strings, donde cada string es el ID
  // de un producto marcado como favorito.
  // También usamos "Lazy Initialization" para leer el localStorage al iniciar la aplicación.
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('trespa_wishlist');
      // Si existen favoritos guardados, convertimos el string JSON de vuelta a un arreglo de IDs.
      // Si no existe nada, inicializamos con un arreglo vacío [].
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false); // Nuevo: Estado para abrir/cerrar favoritos (Wishlist)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<'tallas' | 'politicas' | 'pagos' | 'transportes'>('tallas');

  const openInfoModal = (tab: 'tallas' | 'politicas' | 'pagos' | 'transportes') => {
    setInfoModalTab(tab);
    setInfoModalOpen(true);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Dama' | 'Caballero' | 'Unisex'>('Todos');

  // Filtro de precio (slider): minPrice/maxPrice son el rango elegido por el
  // usuario. catalogMaxPrice es el precio real más alto del catálogo (no un
  // valor fijo) y se usa como techo del slider y de los inputs numéricos.
  // priceInitialized evita que, una vez el usuario mueve el slider, un
  // recálculo de catalogMaxPrice (ej. cambia el catálogo) le pise el valor.
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceInitialized, setPriceInitialized] = useState(false);

  // Drawer de filtros en mobile (bottom sheet) — el panel inline solo se
  // muestra desde md+ (ver <FilterPanelBody />).
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ==========================================
  // PRODUCTOS: ahora vienen de Supabase (antes venían de data.ts, fijos)
  // ==========================================
  // Se cargan una vez al montar la app. Mientras cargan, se muestra el
  // skeleton que ya existía (isCatalogLoading). Si algo falla (sin internet,
  // Supabase caído), products queda vacío y se muestra el estado
  // "sin resultados" que ya maneja el catálogo más abajo.
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsCatalogLoading(true);
    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setProductsError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setProductsError(err.message || 'No se pudo cargar el catálogo');
      })
      .finally(() => {
        if (!cancelled) setIsCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // CATEGORIES y BRANDS ahora se calculan a partir de los productos que
  // llegaron de Supabase, en vez de ser fijos.
  const CATEGORIES = useMemo(
    () => ['Todos', ...new Set(products.map((p) => p.category))],
    [products]
  );
  const BRANDS = useMemo(
    () => ['Todas', ...new Set(products.map((p) => p.brand))],
    [products]
  );

  // Precio máximo real del catálogo (no un valor fijo/hardcodeado), usado
  // como techo del slider de precio y de los inputs "Hasta $".
  const catalogMaxPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(...products.map((p) => p.price));
  }, [products]);

  // Una sola vez, cuando el catálogo termina de cargar, arrancamos el rango
  // de precio en [0, catalogMaxPrice] (todo el catálogo visible por defecto).
  useEffect(() => {
    if (!priceInitialized && catalogMaxPrice > 0) {
      setMaxPrice(catalogMaxPrice);
      setPriceInitialized(true);
    }
  }, [catalogMaxPrice, priceInitialized]);

  // Generar puntuaciones aleatorias estables para cada producto al montar el componente.
  // Esto evita que los productos salten o cambien de posición al agregarlos al carrito o interactuar.
  const randomScores = useMemo(() => {
    const scores: Record<string, number> = {};
    products.forEach((product) => {
      scores[product.id] = Math.random();
    });
    return scores;
  }, [products]);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating'>('default');
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  // Temporizador para desactivar el Splash Screen después de 2.2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 2200); // 2.2 segundos de intro premium
    return () => clearTimeout(timer);
  }, []);

  // Simular animación de carga rápida (shimmer skeleton) al aplicar filtros
  useEffect(() => {
    setIsCatalogLoading(true);
    const timer = setTimeout(() => {
      setIsCatalogLoading(false);
    }, 600); // 600ms de animación de carga elegante
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedBrand, selectedGender, sortBy, onlyDiscounts, searchQuery]);
  
  // Cargar búsqueda desde la URL al iniciar la aplicación (para compartir productos desde WhatsApp)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchQuery(decodeURIComponent(searchParam));
      }
    } catch (e) {
      console.error('Error al parsear parámetros URL:', e);
    }
  }, []);

  // ==========================================
  // ESTADO Y LÓGICA DE NOTIFICACIONES (Toasts)
  // ==========================================
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Función para agregar una nueva notificación flotante con eliminación automática
  const showToast = (message: string, type: 'cart' | 'favorite_add' | 'favorite_remove', productName: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newToast: ToastNotification = { id, message, type, productName };
    setToasts((prev) => [...prev, newToast]);

    // Eliminar automáticamente el toast después de 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Función para cerrar un toast de manera manual
  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };


  // ==========================================
  // SINCROIZACIÓN DEL CARRITO (useEffect)
  // ==========================================
  // El Hook "useEffect" sirve para ejecutar "efectos secundarios" (acciones de sincronización externa o llamadas a APIs).
  // Recibe dos cosas:
  // 1. Una función con el código que queremos ejecutar.
  // 2. Un "arreglo de dependencias" al final: [cartItems].
  // Esto significa: "Ejecuta esta función cada vez que la variable 'cartItems' cambie de valor".
  useEffect(() => {
    // Como localStorage solo admite texto plano, usamos "JSON.stringify" para convertir
    // nuestro arreglo de objetos 'cartItems' en un string con formato JSON de forma segura.
    localStorage.setItem('trespa_cart', JSON.stringify(cartItems));
  }, [cartItems]); // <-- Dependencia: reacciona ante cualquier cambio de elementos en el carrito

  // ==========================================
  // SINCROIZACIÓN DE FAVORITOS (useEffect)
  // ==========================================
  // Ejecutamos este efecto cada vez que el arreglo 'favoriteIds' cambie,
  // para guardar la lista actualizada de favoritos en el almacenamiento del navegador (localStorage).
  useEffect(() => {
    localStorage.setItem('trespa_wishlist', JSON.stringify(favoriteIds));
  }, [favoriteIds]); // <-- Dependencia: se ejecuta cada vez que el usuario agregue/quite un favorito

  // ==========================================
  // ALERTA DE SALIDA SI HAY CARRITO (useEffect)
  // ==========================================
  // Muestra una advertencia al intentar cerrar la pestaña del navegador
  // si el usuario tiene productos en el carrito, recordándole que su selección podría perderse.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cartItems.length > 0) {
        e.preventDefault();
        // Los navegadores modernos no muestran texto personalizado, pero requieren establecer e.returnValue
        e.returnValue = 'Tienes productos en tu carrito. Si cierras la pestaña, tu selección podría perderse.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cartItems]);
  

  // ==========================================
  // ACCIÓN DE AGREGAR/QUITAR FAVORITO (handleToggleFavorite)
  // ==========================================
  // Esta función se pasa como propiedad (prop) a las tarjetas de producto.
  // - Si el ID del producto ya existe en la lista, lo filtramos para removerlo (quitar de favoritos).
  // - Si no está, creamos un nuevo arreglo añadiendo el nuevo ID al final de los anteriores.
  const handleToggleFavorite = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const productName = product ? product.name : 'Producto';

    setFavoriteIds((prev) => {
      if (prev.includes(productId)) {
        showToast('Se eliminó de tus favoritos correctamente.', 'favorite_remove', productName);
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Se guardó en tus favoritos correctamente.', 'favorite_add', productName);
        return [...prev, productId];
      }
    });
  };
  // Cart operations
  const handleAddToCart = (product: Product, size: number, color: string) => {
    if (product.isOutOfStock) {
      showToast('Este producto no se encuentra disponible.', 'favorite_remove', product.name);
      return;
    }
    // Mostrar retroalimentación visual al agregar un producto
    showToast(`Agregado en talla ${size} y color ${color}.`, 'cart', product.name);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        const colorImage = product.colorImages && product.colorImages[color]
          ? product.colorImages[color]
          : product.image;
        return [
          ...prev,
          {
            product,
            quantity: 1,
            selectedSize: size,
            selectedColor: color,
            selectedColorImage: colorImage,
          },
        ];
      }
    });
  };

  const handleIncrement = (index: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity += 1;
      return updated;
    });
  };

  const handleDecrement = (index: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
        return updated;
      }
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
  };

  // Al elegir una sugerencia del buscador: filtramos por el nombre exacto
  // (así aparece aunque otros filtros lo hubieran ocultado) y hacemos scroll
  // hasta su tarjeta. isCatalogLoading tarda 600ms en apagarse tras cambiar
  // searchQuery (shimmer skeleton), así que esperamos un poco más que eso
  // antes de buscar el elemento en el DOM.
  const handleSelectSuggestion = (product: Product) => {
    setSearchQuery(product.name);
    setTimeout(() => {
      document.getElementById(`product-card-${product.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  };

  // / Filtrar productos según búsqueda, categoría, marca, género y descuentos
  const filteredProducts = products.filter((product) => {
// Si el producto está marcado como agotado desde el código (catálogo), simplemente se oculta
    if (product.isOutOfStock) return false;

    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' || product.category === selectedCategory;

    const matchesBrand =
      selectedBrand === 'Todas' || product.brand === selectedBrand;

    const matchesGender =
      selectedGender === 'Todos' || product.gender === selectedGender;

      const matchesDiscounts =
      !onlyDiscounts ||
      (!!product.originalPrice && product.originalPrice > product.price) ||
      (product.price % 10000 === 5000);

    // Antes de que priceInitialized calcule el techo real del catálogo,
    // no filtramos por precio (maxPrice todavía es 0 y ocultaría todo).
    const matchesPrice = !priceInitialized || (product.price >= minPrice && product.price <= maxPrice);

    return matchesSearch && matchesCategory && matchesBrand && matchesGender && matchesDiscounts && matchesPrice;
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;

   // El orden por defecto ('default' / Recomendados) será de manera aleatoria estable por sesión
    return (randomScores[a.id] || 0) - (randomScores[b.id] || 0);
  });

    // ==========================================
  // ESTADO DE PAGINACIÓN / CARGAR MÁS
  // ==========================================
  // Cantidad inicial y lote de carga para los productos del catálogo
  const PRODUCTS_PER_PAGE = 8;
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  // Reiniciar la cantidad visible cada vez que el usuario aplique algún filtro
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedBrand, selectedGender, sortBy, onlyDiscounts, minPrice, maxPrice]);

  // Lista de productos limitada para mostrar en la vista actual
  const displayedProducts = sortedProducts.slice(0, visibleCount);

  // Calculate total items in cart
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Clear all active filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedBrand('Todas');
    setSelectedGender('Todos');
    setSortBy('default');
    setOnlyDiscounts(false);
    setMinPrice(0);
    setMaxPrice(catalogMaxPrice);
  };

  const formatPriceCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const isPriceFiltered = priceInitialized && (minPrice > 0 || maxPrice < catalogMaxPrice);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-brand-sky/30 selection:text-brand-blue">
       {/* Pantalla de carga introductoria (Splash Screen) */}
      <AnimatePresence>
        {isSplashLoading && (
          <SplashScreen onComplete={() => setIsSplashLoading(false)} />
        )}
      </AnimatePresence>
      {/* Componente de barra de navegación */}
      <Navbar
        cartItemsCount={cartItemsCount}
        onCartOpen={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenInfo={openInfoModal}
        wishlistItemsCount={favoriteIds.length} // Nuevo: pasamos la cantidad de productos favoritos actuales
        onWishlistOpen={() => setIsWishlistOpen(true)} // Nuevo: función para abrir la barra lateral de favoritos
        products={products}
        onSelectSuggestion={handleSelectSuggestion}
      />

 {/* Sección del Banner Principal (Hero) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="relative bg-slate-950 rounded-[40px] p-8 sm:p-10 md:p-12 overflow-hidden shadow-2xl">
          {/* Anillos gráficos de ambientación */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-72 h-72 bg-brand-sky/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Detalles del llamado a la acción */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left py-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-semibold tracking-wider uppercase"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{bannerText.toUpperCase()}</span>
                <span className="inline-flex flex-col w-5 h-3.5 rounded-xs overflow-hidden shadow-xs border border-brand-sky/20 shrink-0 select-none" title="Colombia">
                  <span className="bg-[#FCD116] h-1/2 w-full" />
                  <span className="bg-[#003893] h-1/4 w-full" />
                  <span className="bg-[#CE1126] h-1/4 w-full" />
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]"
              >
                ESTILO EN CADA<span className="text-brand-yellow"> PASO</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
              >
                Renueva tu colección con los tenis que están rompiendo las redes. Referencias seleccionadas para darte el mejor look y la mayor comodidad en cada salida.
              </motion.p>
            </div>

            {/* Contenedor de la imagen lateral interactiva */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full aspect-square max-w-[360px] mx-auto rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl"
              >
                <img
                  src="/lema.webp"
                  alt="Como el 23"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-105"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-brand-sky uppercase tracking-widest">EL CODIGO TRESPA</span>
                      <p className="font-display font-bold text-sm text-white">Encuentra tu par ideal</p>
                    </div>
                    <span className="text-xs font-bold text-white bg-brand-blue px-2.5 py-1 rounded-lg">🔥</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo principal y sección de filtros */}
      <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* Título y resumen de estadísticas */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Catálogo de <span className="text-brand-blue">Modelos</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Mostrando {sortedProducts.length} de {products.length} referencias de primera calidad
            </p>
          </div>

          {/* selector */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-xs shrink-0 self-start md:self-auto">
            <span className="text-xs text-slate-400 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-bold text-slate-800 outline-none cursor-pointer bg-transparent"
            >
              <option value="default">Recomendados</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="rating">Calificación de clientes</option>
            </select>
          </div>
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
                ¿Buscas más modelos o una referencia específica? 👟✨
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
                <span>✈️</span> Ver Catálogo en Telegram
              </a>
              <a
                href="https://wa.me/573008165725?text=Hola,%20quiero%20ver%20el%20cat%C3%A1logo%20completo%20de%20tenis"
                target="_blank"
                rel="noopener noreferrer"
className="w-full sm:w-auto text-center px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-extrabold rounded-xl transition-all text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs"              >
                <span>💬</span> WhatsApp Directo
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
              {(selectedCategory !== 'Todos' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyDiscounts || isPriceFiltered) && (
                <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                  Filtros Activos
                </span>
              )}
            </div>
            {(selectedCategory !== 'Todos' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyDiscounts || searchQuery !== '' || isPriceFiltered) && (
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
            formatPriceCOP={formatPriceCOP}
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
          {(selectedCategory !== 'Todos' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyDiscounts || isPriceFiltered) && (
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
                  {(selectedCategory !== 'Todos' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyDiscounts || searchQuery !== '' || isPriceFiltered) && (
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
                    formatPriceCOP={formatPriceCOP}
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
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
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
                  onAddToCart={handleAddToCart}
                  onOpenSizeGuide={() => openInfoModal('tallas')}
                  isFavorite={favoriteIds.includes(product.id)} // Nuevo: enviamos si este producto está marcado como favorito
                  onToggleFavorite={handleToggleFavorite} // Nuevo: enviamos la acción para añadir o quitar de favoritos  
                />
              ))}
            </motion.div>
            {/* Botón de Cargar Más para limitar la visualización y mejorar la velocidad de carga inicial */}
              {visibleCount < sortedProducts.length && (
                <div className="flex flex-col items-center justify-center pt-4">
                  <p className="text-xs text-slate-400 mb-3.5 font-medium">
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

      {/* Sección de propuestas de valor y beneficios */}
      <section className="bg-white border-t border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Box 1 */}
            <div className="flex gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Calidad Garantizada</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ofrecemos zapatillas importadas con un alto nivel de detalle, comodidad y excelente relación calidad-precio.
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="flex gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Envío Gratis</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Llegamos a cada rincón de Colombia sin costo adicional. Despachos rápidos con rastreo garantizado.
                </p>
              </div>
            </div>

            {/* {/* Box 3 *
            <div className="flex gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Cambio sin Costo</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  ¿La talla no te quedó? No te preocupes. Realizamos el primer cambio de talla completamente gratis.
                </p>
              </div>
            </div> */}

            {/* Box 4 */}
            <div className="flex gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Atención Humana</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Nada de bots aburridos. Chatea directamente con asesores apasionados por los tenis deportivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
        SECCIÓN DE TESTIMONIOS REALES (WhatsApp style)
        =========================================================================
        - Añadimos la sección de testimonios de clientes que imita la captura de pantalla de chats
          de WhatsApp, justo debajo de la sección de beneficios corporativos (Feature Value Props).
      */}
      <TestimonialsSection />

    {/* Footer */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            
            {/* Col 1 - Centrada y alineada visualmente hacia arriba */}
            <div className="md:col-span-5 flex flex-col items-center text-center space-y-4 md:-mt-4">
              <img
                src="/logo-foot.webp"
                alt="TRESPA STORE"
                loading="lazy" // Carga diferida para optimizar el rendimiento inicial de la página
                className="h-24 sm:h-14 md:h-48 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-light">
                En Trespa Store creemos que unas buenas zapatillas hablan por ti. Por eso ofrecemos referencias importadas con gran nivel de detalle, pensadas para quienes valoran el estilo.
              </p>
              {/* Redes sociales centradas */}
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <a
                  href="https://instagram.com/trespastore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Síguenos en Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com/trespastore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Síguenos en Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://tiktok.com/@trespastore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Síguenos en TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.17 1.98.11 2.97-.16v3.83c-.94.13-1.89.11-2.83-.07-.46-.09-.9-.25-1.31-.48-.68-.39-1.22-.96-1.58-1.66v6.86c.01 1.93-.65 3.86-1.88 5.29-1.46 1.71-3.69 2.68-5.91 2.5-2.5-.18-4.78-1.87-5.56-4.24-.96-2.87.5-6.14 3.32-7.14.73-.26 1.51-.36 2.28-.3v3.74c-.4-.11-.84-.11-1.25-.03-1.12.21-2.02 1.13-2.18 2.26-.25 1.63.85 3.2 2.47 3.44 1.25.19 2.52-.45 2.96-1.63.15-.39.2-.82.19-1.24V.02z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 2 */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brand-sky">Colecciones</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button type="button" onClick={() => { setSelectedCategory('Urbano'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Urbanos</button></li>
                <li><button type="button" onClick={() => { setSelectedCategory('Deportivo'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Deportivos</button></li>
                <li><button type="button" onClick={() => { setSelectedCategory('Colección'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Ediciones Especiales</button></li>
                
                {/* Íconos alineados uniformemente */}
                <li className="pt-2 border-t border-slate-900/60">
                  <button type="button" onClick={() => openInfoModal('tallas')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <span className="w-4 text-center text-sm">📏</span>
                    <span>Guía de Tallas</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => openInfoModal('politicas')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <span className="w-4 text-center text-sm">🛡️</span>
                    <span>Políticas 2026</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => openInfoModal('pagos')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <span className="w-4 text-center text-sm">💳</span>
                    <span>Medios de Pago</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brand-sky">Contacto & Horarios</h4>
              <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <p>
                  Soporte nacional en: <br />
                  <a href="tel:+573008165725" className="text-white hover:underline font-semibold">+57 300 816 5725</a>
                </p>
                <div className="pt-2 border-t border-slate-900/60 space-y-1">
                  <p className="text-slate-300 font-medium text-[11px] uppercase tracking-wider">🕒 Horario de atención:</p>
                  <p>Lunes a Viernes: <span className="text-white font-medium">10:00 AM a 6:00 PM</span></p>
                  <p>Sábados: <span className="text-white font-medium">9:00 AM a 2:00 PM</span></p>
                  <p className="text-rose-400 font-medium text-[11px] pt-0.5">Domingos y Festivos: No hay servicio</p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/573008165725"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse shrink-0" />
                  Asesor de Turno Conectado en WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-900" />

          {/* Copyright, terms */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-light text-center sm:text-left">
            <p>© 2026 Trespa Store. Todos los derechos reservados. Desarrollado por Trespa Store</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">Términos y condiciones</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-300">Tratamiento de datos personales</a>
            </div>
          </div>
        </div>
      </footer>

      {/* CMenú lateral deslizante del carrito (CartSidebar) */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onClearAll={() => setCartItems([])}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* =========================================================================
        MENU LATERAL DE LISTA DE DESEOS (WishlistSidebar overlay)
        =========================================================================
        - Renderizamos el WishlistSidebar pasándole las siguientes propiedades (props):
        - isOpen: indica si debe estar visible (controlado por el estado isWishlistOpen).
        - onClose: función callback que cambia el estado isWishlistOpen a false para cerrarlo.
        - wishlistItems: filtramos el arreglo completo "SNEAKER_PRODUCTS" para pasarle únicamente
          los objetos de tenis cuyos IDs coincidan con los que el usuario tiene guardados en "favoriteIds".
        - onRemove: reusamos la función "handleToggleFavorite" para que, al dar clic en quitar,
          se elimine de la lista de deseos de forma reactiva.
      */}
      <WishlistSidebar
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={products.filter((product) => favoriteIds.includes(product.id))}
        onRemove={handleToggleFavorite}
      />

      {/* Checkout Modal Form */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Info Modals (Tallas, Políticas, Pagos) */}
      <InfoModals
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        initialTab={infoModalTab}
      />

      {/* Floating breathing WhatsApp Support button */}
      <FloatingWhatsapp />

       {/* Control y balance de inventario del catálogo (Estadísticas Temporales) */}
      {/* <FloatingCatalogStats /> */}

      {/* =========================================================================
        BOTÓN FLOTANTE DEL CATÁLOGO DE TELEGRAM (FloatingTelegram)
        =========================================================================
        - Añadimos la llamada al componente "FloatingTelegram" que acabamos de crear.
        - Gracias a su posicionamiento fijo ("bottom-24" en lugar de "bottom-6"),
          este botón se apilará ordenadamente justo por encima del botón de WhatsApp.
      */}
      <FloatingTelegram />
       {/* SISTEMA DE NOTIFICACIONES TOAST */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
