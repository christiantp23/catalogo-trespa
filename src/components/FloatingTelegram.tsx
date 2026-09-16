import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send } from 'lucide-react';
import { useHideNearFooter } from '../hooks/useHideNearFooter';

// =========================================================================
// 5. BOTÓN FLOTANTE DEL CATÁLOGO DE TELEGRAM (FloatingTelegram)
// =========================================================================
// Este componente añade un botón flotante interactivo para que los usuarios
// puedan acceder directamente al catálogo o canal oficial de Telegram de la tienda.
//
// Conceptos para aprender en React:
// - useState: Nos permite controlar de manera reactiva si el globo de texto informativo (Tooltip)
//   debe mostrarse o no cuando el usuario pasa el cursor sobre el botón.
// - AnimatePresence: Es un componente de la biblioteca Framer Motion (importada como "motion/react")
//   que permite animar componentes cuando aparecen o desaparecen de la pantalla (montaje/desmontaje).
// - Tailwind CSS: Usamos posicionamiento absoluto y fijo ("fixed"), con la clase "bottom-[88px]"
//   (24px del borde + 48px de alto + 16px de separación) para posicionar este botón exactamente
//   arriba del botón flotante de WhatsApp, ahora que ambos son más chicos (w-12 h-12).
export default function FloatingTelegram() {
    const [showTooltip, setShowTooltip] = useState(false);
    // Se oculta con una transición suave (no de golpe) al llegar a la franja
    // final del footer ("Términos y condiciones" / "Tratamiento de datos"),
    // para no taparla.
    const shouldHide = useHideNearFooter();

    // Enlace oficial de Telegram de la tienda (puedes cambiarlo por tu canal real)
    const telegramChannelUrl = 'https://telegram.me/+k6-HnPX2z6o1NWEx';

    return (
        <div
            className={`fixed bottom-[88px] right-6 z-40 flex items-center gap-3 transition-opacity duration-300 ${
                shouldHide ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onMouseEnter={() => setShowTooltip(true)} // Al pasar el cursor, activamos el tooltip
            onMouseLeave={() => setShowTooltip(false)} // Al retirar el cursor, lo ocultamos
        >
            {/* Globo informativo animado (Tooltip) */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.95 }} // Estado inicial (invisible y un poco a la derecha)
                        animate={{ opacity: 1, x: 0, scale: 1 }}     // Estado visible (opacidad completa en su posición)
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}      // Estado al desaparecer
                        className="hidden sm:flex items-center gap-1.5 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-xl shadow-lg font-medium whitespace-nowrap"
                    >
                        <Send className="w-3.5 h-3.5" /> ¡Únete a nuestro canal de Telegram!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón Circular de Telegram */}
            <a
                href={telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-12 h-12 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-[#0088cc]/40 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-blue-100"
                title="Ver Catálogo en Telegram"
            >
                {/* Anillo exterior animado de respiración */}
                {/* La clase "animate-ping" crea un efecto de pulso circular constante que llama la atención del usuario */}
                <span className="absolute inset-0 rounded-full bg-[#0088cc] opacity-30 animate-ping group-hover:animate-none" />

                {/* Ícono SVG Oficial de Telegram en alta fidelidad */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 relative z-10"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.1.02-1.65 1.04-4.65 3.07-.44.3-.84.45-1.2.44-.4-.01-1.16-.23-1.72-.41-.7-.23-1.24-.35-1.19-.74.03-.2.3-.4.81-.6l11.19-4.31c.51-.19.98-.03 1.15.26.17.29.12.79-.1 1.02z"
                    />
                </svg>
            </a>
        </div>
    );
}
