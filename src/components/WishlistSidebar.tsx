import { X, Heart, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

// =========================================================================
// 2. COMPONENTE DE LA LISTA DE DESEOS (WishlistSidebar)
// =========================================================================
// Este componente define la barra lateral (Drawer) que muestra los productos favoritos.
// Recibe como propiedades (Props):
// - isOpen: Controla si la barra lateral está visible o no.
// - onClose: Función que se ejecuta para cerrar la barra lateral.
// - wishlistItems: Un arreglo de objetos tipo Product con los favoritos del cliente.
// - onRemove: Función para quitar un producto de favoritos.
interface WishlistSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    wishlistItems: Product[];
    onRemove: (productId: string) => void;
}

export default function WishlistSidebar({
    isOpen,
    onClose,
    wishlistItems,
    onRemove,
}: WishlistSidebarProps) {

    // Función auxiliar para dar formato a los precios en Pesos Colombianos (COP)
    const formatPrice = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Función para cerrar el menú lateral y desplazarse (scroll) suavemente hasta el producto en la página
    const handleScrollToProduct = (productId: string) => {
        // Cerramos el menú lateral primero para que el cliente pueda ver la pantalla principal
        onClose();

        // Esperamos un momento breve (150ms) a que la animación de cierre termine
        setTimeout(() => {
            // Buscamos el elemento en el documento HTML usando el ID único que le pusimos a cada tarjeta de producto
            const element = document.getElementById(`product-card-${productId}`);
            if (element) {
                // Desplazamos la vista del navegador de forma suave (smooth) hasta centrar el producto en pantalla
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Añadimos una pequeña clase de animación temporal para que el usuario identifique el producto
                element.classList.add('ring-4', 'ring-rose-500/30', 'scale-102');
                setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-rose-500/30', 'scale-102');
                }, 1500);
            }
        }, 150);
    };

    return (
        // AnimatePresence permite a Framer Motion animar elementos cuando se desmontan (salen) del DOM.
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Fondo oscuro traslúcido (Backdrop) */}
                    {/* Al hacer clic en este fondo se ejecuta "onClose" para cerrar el panel */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950 z-50 cursor-pointer"
                    />

                    {/* Panel Lateral de Favoritos */}
                    {/* Usamos propiedades de "motion.div" para animar su entrada deslizándose desde la derecha (x: '100%' a x: 0) */}
                    <motion.div
                        id="wishlist-sidebar"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col h-full border-l border-slate-100"
                    >
                        {/* Cabecera del Panel */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                {/* Ícono de corazón estilizado con fondo rosa claro */}
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                    <Heart className="w-5 h-5 fill-rose-500" />
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-slate-900">Mis Favoritos</h2>
                                    <p className="text-xs text-slate-500">
                                        {wishlistItems.length} {wishlistItems.length === 1 ? 'modelo guardado' : 'modelos guardados'}
                                    </p>
                                </div>
                            </div>

                            {/* Botón de cierre (X) */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                aria-label="Cerrar favoritos"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Listado de Productos Favoritos */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {wishlistItems.length === 0 ? (
                                // Vista del estado vacío si no hay favoritos
                                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-200">
                                        <Heart className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display font-bold text-slate-900 text-base mb-1">Tu lista está vacía</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mb-6">
                                        ¿Te gustó algún modelo? Agrégalo a tu lista de favoritos con el corazón para tenerlo en la mira antes de decidirte.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-brand-blue text-white text-xs font-bold transition-all duration-200 uppercase tracking-wider cursor-pointer"
                                    >
                                        Explorar Colección
                                    </button>
                                </div>
                            ) : (
                                // Mapeo (Renderizado dinámico) de cada producto favorito
                                wishlistItems.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group"
                                    >
                                        {/* Miniatura de la imagen */}
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0 relative">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                loading="lazy" // Carga diferida para optimizar la lista del carrito
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Información del producto favorito */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-1">
                                                    <h4 className="font-semibold text-slate-900 text-sm truncate pr-6">
                                                        {product.name}
                                                    </h4>

                                                    {/* Botón para quitar de favoritos (Ícono de basurero / Trash) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemove(product.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors absolute top-3 right-3 cursor-pointer"
                                                        title="Quitar de favoritos"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    Marca: {product.brand} | Categoría: {product.category}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-2.5">
                                                {/* Precio actual */}
                                                <span className="text-sm font-bold text-slate-950 font-display">
                                                    {formatPrice(product.price)}
                                                </span>

                                                {/* Botón para deslizarse al producto y verlo completo */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleScrollToProduct(product.id)}
                                                    className="text-[11px] font-bold text-brand-blue hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:underline"
                                                >
                                                    Ver modelo
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer de la Barra Lateral */}
                        {wishlistItems.length > 0 && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-brand-blue text-white text-xs font-bold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Seguir Comprando
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}