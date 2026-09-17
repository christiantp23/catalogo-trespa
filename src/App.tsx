import { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  TrendingUp,
  Filter,
  Heart,
  ArrowUpRight,
  CheckCircle,
  Percent,
  ChevronDown,
  Instagram,
  Facebook,
  BookImage,
  DollarSign,
  ArrowRight,
  X,
  Tag,
  Flame,
  Users,
  Venus,
  Mars,
  VenusAndMars,
  Send,
  MessageCircle,
  Ruler,
  ShieldCheck,
  CreditCard,
  Clock,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Product, CartItem, ToastNotification} from './types';
import { fetchProducts } from './lib/products';
import { useSiteSettings } from './lib/settings';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import CatalogSection from './components/CatalogSection';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import CheckoutModal from './components/CheckoutModal';
import FloatingWhatsapp from './components/FloatingWhatsapp';
import FloatingTelegram from './components/FloatingTelegram';
import InfoModals from './components/InfoModals';
import TestimonialsSection from './components/TestimonialsSection'; // Nuevo: Importamos la sección de testimonios de clientes (WhatsApp chats)
import TrustSection from './components/TrustSection';
import ToastContainer from './components/ToastContainer';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const { bannerText, whatsappNumber, telegramLink, maintenanceMode, settingsLoaded } = useSiteSettings();
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
  // muestra desde md+ (ver CatalogSection.tsx / FilterPanelBody.tsx).
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
  }, [selectedCategory, selectedBrand, selectedGender, onlyDiscounts, searchQuery]);
  
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

  // Orden estable y aleatorio por sesión (evita que los productos salten
  // de posición al agregarlos al carrito o interactuar con los filtros)
  const sortedProducts = [...filteredProducts].sort(
    (a, b) => (randomScores[a.id] || 0) - (randomScores[b.id] || 0)
  );

    // ==========================================
  // ESTADO DE PAGINACIÓN / CARGAR MÁS
  // ==========================================
  // Cantidad inicial y lote de carga para los productos del catálogo
  const PRODUCTS_PER_PAGE = 8;
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  // Reiniciar la cantidad visible cada vez que el usuario aplique algún filtro
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedBrand, selectedGender, onlyDiscounts, minPrice, maxPrice]);

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
    setOnlyDiscounts(false);
    setMinPrice(0);
    setMaxPrice(catalogMaxPrice);
  };

  const isPriceFiltered = priceInitialized && (minPrice > 0 || maxPrice < catalogMaxPrice);

  // Modo mantenimiento: reemplaza todo el catálogo por una pantalla simple
  // "Volvemos pronto". Solo afecta al sitio público (#admin nunca pasa por
  // este componente, así que el dueño siempre puede entrar a apagarlo).
  // Esperamos a que cargue la configuración (settingsLoaded) antes de
  // decidir, para no mostrar el catálogo un instante y luego taparlo.
  if (settingsLoaded && maintenanceMode) {
    const supportText = encodeURIComponent(
      'Hola Trespa Store 👋, vi que la tienda está en mantenimiento y quería consultar disponibilidad.'
    );
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <img src="/logo-trimmed.webp" alt="Trespa Store" className="h-14 w-auto object-contain mx-auto" />
          <div className="space-y-2">
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">Volvemos pronto</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Estamos haciendo algunos ajustes en la tienda. Mientras tanto, podés escribirnos y te ayudamos igual.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${supportText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Escribinos por WhatsApp
            </a>
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors border border-white/10"
              >
                <Send className="w-4 h-4" /> Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

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
      <Hero bannerText={bannerText} />

      {/* Catálogo principal y sección de filtros */}
      <CatalogSection
        products={products}
        sortedProducts={sortedProducts}
        displayedProducts={displayedProducts}
        favoriteIds={favoriteIds}
        isCatalogLoading={isCatalogLoading}
        productsError={productsError}
        isFilterDrawerOpen={isFilterDrawerOpen}
        setIsFilterDrawerOpen={setIsFilterDrawerOpen}
        filters={{
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
        }}
        filterActions={{
          setSelectedCategory,
          setSelectedBrand,
          setSelectedGender,
          setMinPrice,
          setMaxPrice,
          setOnlyDiscounts,
          resetFilters,
        }}
        pagination={{
          visibleCount,
          setVisibleCount,
          PRODUCTS_PER_PAGE,
        }}
        onAddToCart={handleAddToCart}
        onToggleFavorite={handleToggleFavorite}
        onOpenSizeGuide={() => openInfoModal('tallas')}
      />

      {/* Sección de propuestas de valor y beneficios */}
      <TrustSection />

      {/* =========================================================================
        SECCIÓN DE TESTIMONIOS REALES (WhatsApp style)
        =========================================================================
        - Añadimos la sección de testimonios de clientes que imita la captura de pantalla de chats
          de WhatsApp, justo debajo de la sección de beneficios corporativos (Feature Value Props).
      */}
      <TestimonialsSection />

    {/* Footer */}
      <Footer openInfoModal={openInfoModal} />

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
