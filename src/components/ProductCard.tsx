import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, ShoppingBag, Check, ZoomIn, X, ChevronLeft, ChevronRight, Heart, Share2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

// =========================================================================
// INTERFAZ DE PROPIEDADES (ProductCardProps)
// =========================================================================
// Agregamos dos nuevas propiedades para controlar la interacción con Favoritos:
// - isFavorite: Indica si este producto en particular ya fue guardado en la lista de deseos.
// - onToggleFavorite: Función callback que avisa al componente padre (App.tsx)
//   para que agregue o remueva este producto de la lista en localStorage.
interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product, size: number, color: string) => void;
  onOpenSizeGuide?: () => void;
  isFavorite?: boolean; // Nuevo: si está en la lista de favoritos
  onToggleFavorite?: (productId: string) => void; // Nuevo: acción para añadir/quitar de favoritos
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onOpenSizeGuide,
  isFavorite = false, // Por defecto es falso
  onToggleFavorite
}: ProductCardProps) {
  // Filtrar colores válidos (evitar strings vacíos como [''])
  const validColors = product.colors ? product.colors.filter(c => c && c.trim() !== '') : [];
  const [selectedColor, setSelectedColor] = useState<string>(
    validColors.length > 0 ? validColors[0] : (product.colors[0] || '')
  );

  // Tallas del color actualmente seleccionado, con su disponibilidad real.
  // Si el producto no trae sizesByColor (dato viejo o color sin colorway),
  // caemos de vuelta a la lista plana de "sizes" tratándolas todas como
  // disponibles, para no romper productos ya cargados.
  const currentSizeOptions = useMemo(() => {
    const fromColor = product.sizesByColor?.[selectedColor];
    if (fromColor && fromColor.length > 0) return fromColor;
    return product.sizes.map((size) => ({ size, available: true }));
  }, [product.sizesByColor, product.sizes, selectedColor]);

  const [selectedSize, setSelectedSize] = useState<number>(() => {
    const firstAvailable = currentSizeOptions.find((s) => s.available);
    return (firstAvailable ?? currentSizeOptions[0])?.size ?? product.sizes[0];
  });

  // Si el color cambia y la talla elegida ya no está disponible en ese color
  // (o no existe), seleccionamos automáticamente la primera talla disponible.
  useEffect(() => {
    const stillAvailable = currentSizeOptions.some((s) => s.size === selectedSize && s.available);
    if (stillAvailable) return;
    const firstAvailable = currentSizeOptions.find((s) => s.available);
    if (firstAvailable) setSelectedSize(firstAvailable.size);
    else if (currentSizeOptions.length > 0) setSelectedSize(currentSizeOptions[0].size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor]);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

// States for interactive magnifier zoom inside the lightbox
  const [isInnerZoomed, setIsInnerZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    // Estados y referencias de toque y deslizamiento para compatibilidad con dispositivos móviles
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwipedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    if (Math.abs(diffX) > 15) {
      isSwipedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Solo deslizamos si es un movimiento horizontal, no un desplazamiento (scroll) vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 40) { // Umbral mínimo de 40px
        if (diffX > 0) {
          // Deslizar a la derecha -> Imagen anterior
          setActiveImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
        } else {
          // Deslizar a la izquierda -> Siguiente imagen
          setActiveImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
        }
        isSwipedRef.current = true;
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleInnerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isInnerZoomed) return;
    // Evitar el comportamiento de scroll predeterminado al arrastrar dentro de la vista con zoom para mantenerlo suave
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    // Restringir el toque dentro del contenedor
    const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
    setZoomPosition({ x, y });
  };

  const handleInnerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  // Resetear el índice de imagen activa al primer plano cuando el usuario cambie el color seleccionado
  useEffect(() => {
    setActiveImgIndex(0);
  }, [selectedColor]);

  // Fallback images map
  const fallbackImages: Record<string, string> = {
    'adidas-forum-low-strap-white': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=800',
    'adidas-forum-low-strap-black': 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=800',
    'adidas-forum-low-strap-blue': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800',
    'nike-dunk-low-brown-sail': 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800',
    'on-cloudrunner-lavender-storm': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
    'on-cloudrunner-beige-sunset': 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=800',
    'adidas-superstar-maroon-teddy': 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800',
    'nike-air-force-1': 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800',
    'nike-air-max-270': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
    'adidas-ultraboot-light': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800',
    'new-balance-550': 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800',
    'air-jordan-1-retro': 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800',
    'puma-deviate-nitro': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800',
    'new-balance-9060': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800'
  };

   // Combinar automáticamente la imagen principal y las imágenes secundarias del carrusel para no perder ninguna
  const allImages = (() => {
    const list: string[] = [];
    // 1. Si hay una foto específica para el color elegido, la ponemos de primera
    if (product.colorImages && product.colorImages[selectedColor]) {
      list.push(product.colorImages[selectedColor]);
    } else if (product.image) {
      list.push(product.image);
    }
    // 2. Agregamos las imágenes secundarias de product.images
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && img.trim() !== '' && !list.includes(img)) {
          list.push(img);
        }
      });
    }
      // 3. Agregamos la imagen por defecto si no ha sido incluida
    if (product.image && !list.includes(product.image)) {
      list.push(product.image);
    }

    // 4. Agregamos las imágenes de otros colores al final por si el usuario explora la galería
    if (product.colorImages) {
      Object.entries(product.colorImages).forEach(([color, img]) => {
        if (img && color !== selectedColor && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    
    return list.length > 0 ? list : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'];
  })();
  
  const currentImage = imageError 
    ? (fallbackImages[product.id] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800') 
    : (allImages[activeImgIndex] || product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800');

  const handleAdd = () => {
    if (!isOptionsOpen) {
      setIsOptionsOpen(true);
      return;
    }
    
    onAddToCart(product, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsOptionsOpen(false);
    }, 1500);
  };

  // Helper para formatear moneda
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

    // Calcular el porcentaje de descuento si existe originalPrice
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

    // Lógica de oferta dinámica para precios que terminan en 5000
  const esOferta = product.price % 10000 === 5000;

  // URL y mensaje para compartir en WhatsApp
  const shareWhatsAppUrl = (() => {
    const productName = product.name;
    const productPrice = formatPrice(product.price);
    const productBrand = product.brand;
    
    // Construir la URL del catálogo filtrado por el nombre del producto
    const shareUrl = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(productName)}`;
    
    // Mensaje predefinido elegante y bien redactado
    const message = `¡Hola! Mira este espectacular producto en el catálogo:\n\n*${productName}*\n👟 Marca: ${productBrand}\n💵 Precio: ${productPrice}\n\n👉 Ver detalles del producto en el catálogo aquí:\n${shareUrl}`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  })();

  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      {/* Distintivos (Badges) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
        {product.isOutOfStock && (
          <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white bg-rose-700/90 backdrop-blur-xs rounded-[9px] shadow-xs">
            Agotado 🚫
          </span>
        )}
        {product.gender && (
          <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-xs rounded-[9px] shadow-xs flex items-center gap-1 ${
            product.gender === 'Dama'
              ? 'bg-purple-950/90 text-purple-200 border border-purple-500/10'
              : product.gender === 'Caballero'
              ? 'bg-slate-900/90 text-slate-200 border border-slate-700/10'
              : 'bg-blue-950/90 text-blue-200 border border-blue-500/10'
          }`}>
            {product.gender === 'Dama' ? '🌸 Dama' : product.gender === 'Caballero' ? '⚡ Caballero' : '👥 Unisex'}
          </span>
        )}
        {product.isNew && (
          <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white bg-blue-600/90 backdrop-blur-xs rounded-[9px] shadow-xs border border-blue-500/10">
            Nuevo
          </span>
        )}
        {product.isHot && (
          <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white bg-emerald-600/90 backdrop-blur-xs rounded-[9px] shadow-xs border border-emerald-500/10">
            Top Ventas
          </span>
        )}
      {esOferta ? (
          <span className="px-2.5 py-0.5 text-[11px] font-black text-white bg-red-600 rounded-[9px] shadow-md shadow-red-500/30 border border-red-500/20">
            -8% OFERTA
          </span>
        ) : (
          product.originalPrice && discountPercentage > 0 && (

          <span className="px-2.5 py-0.5 text-[11px] font-black text-white bg-gradient-to-r from-red-600/95 to-orange-500/95 backdrop-blur-xs rounded-[9px] shadow-md shadow-red-500/30 border border-red-500/20 flex items-center gap-1">
            <span>🔥 -{discountPercentage}%</span>
            <span className="text-[8px] font-bold text-white/90 tracking-wider uppercase ml-1">OFERTA</span>
          </span>
        )
        )}
      </div>

        {/* =========================================================================
        BOTÓN DE LISTA DE DESEOS / FAVORITOS (Heart Button)
        =========================================================================
        - Usamos un botón absoluto posicionado en la esquina superior derecha (top-4, right-4).
        - Al hacer clic, detenemos la propagación (stopPropagation) para evitar que se abra
        el visor de zoom del producto.
        - Llamamos a "onToggleFavorite" pasando el ID del producto actual.
        - El ícono Heart cambia de color dinámicamente: rosa con relleno si isFavorite es true,
        o gris sutil si es false.
      */}
      <button
        id={`wishlist-btn-${product.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Detiene el clic para que no active el modal de zoom de la tarjeta
          if (onToggleFavorite) {
            onToggleFavorite(product.id);
          }
        }}
        className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-slate-700 w-9 h-9 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border border-slate-100 flex items-center justify-center group/heart"
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart 
          className={`w-4.5 h-4.5 transition-colors ${
            isFavorite 
              ? 'fill-rose-500 text-rose-500 scale-105' 
              : 'text-slate-400 group-hover/heart:text-rose-500 group-hover/heart:scale-105'
          }`} 
        />
      </button>


      {/* Contenedor de la galería de imágenes */}
      <div 
        onClick={() => {
          if (!isSwipedRef.current) {
            setIsZoomOpen(true);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden bg-slate-50 pt-[100%] cursor-zoom-in group/img border-b border-slate-100 touch-pan-y"
      >
        <img
          src={currentImage}
          alt={product.name}
          loading="lazy" // Carga diferida para optimizar el rendimiento inicial de la página
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Indicador de superposición de zoom al pasar el cursor */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transform scale-95 group-hover/img:scale-100 transition-all duration-300">
            <ZoomIn className="w-4 h-4 text-blue-600" />
            <span>Ver en Grande</span>
          </div>
        </div>

        {/* Controles de navegación de la galería */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 hover:scale-110 active:scale-95 transition-all duration-250 cursor-pointer z-20 border border-slate-100 flex items-center justify-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 hover:scale-110 active:scale-95 transition-all duration-250 cursor-pointer z-20 border border-slate-100 flex items-center justify-center"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            </button>

            {/* Puntos indicadores de la galería */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-20 bg-black/25 backdrop-blur-xs px-2 py-1 rounded-full">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    i === activeImgIndex ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Ver foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Etiqueta rápida de la marca */}
        <span className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md z-20">
          {product.brand}
        </span>
      </div>

      {/* Información del producto */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Calificacion */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500 ml-1">
              {product.rating}
            </span>
          </div>

          {/* Titulo */}
          <h3 className="font-display text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

           {/* Descripción */}
          <div className="relative mb-4">
            <div className="relative">
            <p className={`text-xs text-slate-500 leading-relaxed transition-all duration-300 ${
              isDescExpanded ? 'line-clamp-none' : 'line-clamp-2'
            }`}>
              {product.description}
            </p>
             {/* Máscara de degradado difuminado */}
              {!isDescExpanded && product.description && product.description.length > 90 && (
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            {product.description && product.description.length > 90 && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors mt-1 cursor-pointer flex items-center gap-0.5"
              >
                {isDescExpanded ? 'Ver menos' : 'Leer descripción completa'}
              </button>
            )}
          </div>
        </div>

        <div>
          {/* Precios y botón de compra con resaltado de descuento */}
          <div className="flex flex-col gap-1 mb-4">
            {esOferta ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-display text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-slate-400 line-through font-medium">
                    {formatPrice(product.price + 15000)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500">
                    -8% DTO Ahorras $ 15.000
                  </span>
                </div>
              </>
            ) : (
              <>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-display ${product.originalPrice ? 'text-rose-600' : 'text-slate-950'}`}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.originalPrice && discountPercentage > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  -{discountPercentage}% DTO
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Ahorras {formatPrice(product.originalPrice - product.price)}
                </span>
              </div>
              )}
              </>
            )}
          </div>


          {/*  Selector de opciones expandible */}
          <AnimatePresence initial={false}>
            {isOptionsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-slate-100 pt-3 mb-3"
              >
                {/* Elegir Color */}
                <div className="mb-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Color: {selectedColor}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          selectedColor === color
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Elegir talla */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Talla (EUR): {selectedSize}
                    </span>
                    {onOpenSizeGuide && (
                      <button
                        type="button"
                        onClick={onOpenSizeGuide}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        📏 Guía de Tallas
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSizeOptions.map(({ size, available }) => (
                      <button
                        key={size}
                        type="button"
                        disabled={!available}
                        title={available ? undefined : 'Talla agotada en este color'}
                        onClick={() => available && setSelectedSize(size)}
                        className={`w-9 h-9 text-xs rounded-lg border flex items-center justify-center gap-0.5 transition-all ${
                          !available
                            ? 'border-slate-100 text-slate-300 bg-slate-50 line-through cursor-not-allowed'
                            : selectedSize === size
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                        }`}
                      >
                        {!available && <Lock className="w-2.5 h-2.5 shrink-0" />}
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {isOptionsOpen && (
              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                className="px-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all text-xs font-semibold"
              >
                Atrás
              </button>
            )}
  <button
              id={`add-to-cart-btn-${product.id}`}
              type="button"
              onClick={handleAdd}
              disabled={isAdded || product.isOutOfStock}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                product.isOutOfStock
                  ? 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-200'
              }`}
            >
              {product.isOutOfStock ? (
                <>
                  <X className="w-4 h-4 text-slate-400" />
                  Agotado
                </>
              ) : isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Agregado!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  {isOptionsOpen ? 'Confirmar Talla' : 'Solicitar Pedido'}
                </>
              )}
            </button>
          </div>
          <a
            id={`share-whatsapp-link-${product.id}`}
            href={shareWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="mt-2 w-full py-2.5 px-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            Compartir por WhatsApp
          </a>
        </div>
      </div>

      {/* Modal de caja de luz (Lightbox) de pantalla completa */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsZoomOpen(false)}
          >
            {/* Botón de cierre en la parte superior derecha */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomOpen(false);
              }}
              className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 cursor-pointer z-50 shadow-lg backdrop-blur-xs border border-white/10"
              aria-label="Cerrar vista grande"
            >
              <X className="w-6 h-6" />
            </button>


            {/* Marco de contenido interno */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-lg md:max-w-xl w-full max-h-[85vh] flex flex-col items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel de imagen del producto con un brillo suave y agradable */}
              <div 
                className={`relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 max-h-[70vh] flex items-center justify-center p-2 select-none w-full ${
                  isInnerZoomed ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSwipedRef.current) {
                  }
                  setIsInnerZoomed(!isInnerZoomed);
                }}
                onMouseMove={handleInnerMouseMove}
                onTouchStart={(e) => {
                  if (!isInnerZoomed) {
                    handleTouchStart(e);
                  }
                }}
                onTouchMove={(e) => {
                  if (isInnerZoomed) {
                    handleInnerTouchMove(e);
                  } else {
                    handleTouchMove(e);
                  }
                }}
                onTouchEnd={(e) => {
                  if (!isInnerZoomed) {
                    handleTouchEnd(e);
                  }
                }}
                onMouseLeave={() => {
                  if (isInnerZoomed) {
                    setIsInnerZoomed(false);
                  }
                }}
              >
                <img
                  src={currentImage}
                  alt={product.name}
                  loading="lazy" // Carga diferida para optimizar el rendimiento inicial de la página
                  referrerPolicy="no-referrer"
                  className="max-h-[66vh] max-w-full rounded-2xl object-contain select-none transition-transform duration-200 ease-out"
                  style={{ 
                    minWidth: '280px',
                    transform: isInnerZoomed ? 'scale(2.2)' : 'scale(1)',
                    transformOrigin: isInnerZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                  }}
                />

                {/*  Indicador flotante del estado de zoom */}
                {isInnerZoomed ? (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/95 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg border border-white/15 z-40 flex items-center gap-1.5 pointer-events-none transition-all duration-300">
                    <ZoomIn className="w-4 h-4 animate-pulse text-amber-300" />
                    <span>Zoom x2.2 activo &bull; Mueve el mouse o arrastra tu dedo para explorar</span>
                  </div>
                ) : (
                  <div className={`absolute left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white/95 text-[10px] font-medium px-4 py-2 rounded-full shadow-md border border-white/5 z-20 flex items-center gap-1.5 pointer-events-none transition-all duration-300 ${
                    allImages.length > 1 ? 'bottom-20' : 'bottom-4'
                  }`}>
                    <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Toca o haz clic en la foto para ver detalles</span>
                  </div>
                )}

                {/* Left/Right Zoom Navigation Controls - Hidden during active zoom for immersion */}
                {!isInnerZoomed && allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInnerZoomed(false);
                        setActiveImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-xl transition-all duration-200 cursor-pointer z-30 border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInnerZoomed(false);
                        setActiveImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-xl transition-all duration-200 cursor-pointer z-30 border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95"
                      aria-label="Siguiente foto"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Miniature Thumbnail Selector Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 z-30">
                      {allImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsInnerZoomed(false);
                            setActiveImgIndex(idx);
                          }}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === activeImgIndex ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Elemento flotante del logotipo de la marca dentro de la imagen - Oculto durante el zoom para mayor claridad */}
                {!isInnerZoomed && (
                  <span className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border border-white/10 z-20">
                    {product.brand}
                  </span>
                )}

                {!isInnerZoomed && product.gender && (
                  <span className={`absolute top-4 right-4 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-md border border-white/10 flex items-center gap-1 z-20 ${
                    product.gender === 'Dama' ? 'bg-pink-500' :
                    product.gender === 'Caballero' ? 'bg-slate-800' :
                    'bg-indigo-600'
                  }`}>
                    {product.gender} {product.gender === 'Dama' ? '🌸' : product.gender === 'Caballero' ? '⚡' : '👥'}
                  </span>
                )}
              </div>

              {/* Tarjeta de detalles inferior */}
              <div className="mt-4 text-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-white max-w-lg shadow-xl w-full">
                <h4 className="font-display text-base font-bold tracking-tight">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Categoría: <span className="font-semibold text-white">{product.category}</span> &bull; 
                  Tallas: <span className="font-semibold text-white">{product.sizes.join(', ')}</span>
                </p>
                {product.description && (
                  <p className="text-xs text-slate-200 mt-3 leading-relaxed max-h-32 overflow-y-auto px-1 text-center md:text-justify scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {product.description}
                  </p>
                )}
                <div className="flex flex-col items-center gap-1 mt-3.5 pt-2 border-t border-white/10">
                  {esOferta ? (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-red-400 font-black">
                          ${product.price.toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ${(product.price + 15000).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md mt-1 animate-pulse">
                        🔥 ¡-8% DTO Ahorras $ 15.000 COP!
                      </span>
                    </>
                  ) : (
                    <>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-bold ${product.originalPrice ? 'text-rose-400 font-black' : 'text-blue-300'}`}>
                      ${product.price.toLocaleString('es-CO')} COP
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ${product.originalPrice.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                  {product.originalPrice && discountPercentage > 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md mt-1 animate-pulse">
                      🔥 ¡Ahorras ${(product.originalPrice - product.price).toLocaleString('es-CO')} COP ({discountPercentage}% Dto)!
                    </span>
                    )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
