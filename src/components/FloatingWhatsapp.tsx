import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '../lib/settings';

export default function FloatingWhatsapp() {
  const [showTooltip, setShowTooltip] = useState(false);
  const { whatsappNumber } = useSiteSettings();

  // Default pre-filled message for support
  const supportText = encodeURIComponent(
    'Hola Trespa Store 👋, visité su tienda online de tenis y me gustaría recibir asesoría sobre sus modelos disponibles.'
  );
  const waUrl = `https://wa.me/${whatsappNumber}?text=${supportText}`;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip banner */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="hidden sm:flex items-center gap-1.5 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-xl shadow-lg font-medium whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5" /> ¿Necesitas ayuda? Chatea con nosotros
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Breathing Ring */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-[#25D366]/40 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-green-100"
        title="Soporte Directo por WhatsApp"
      >
        {/* Breathing Animation Background Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:animate-none" />

        {/* High-fidelity WhatsApp SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 relative z-10"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.174L2.052 21.84a.5.5 0 00.612.612l4.666-1.386A9.964 9.964 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.35 12.395c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.554 6.554 0 01-1.924-1.189 7.228 7.228 0 01-1.33-1.656c-.14-.24-.015-.37.11-.49.112-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.47-.393-.4-.54-.41-.14-.01-.3-.01-.46-.01s-.42.06-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.573.248 1.02.395 1.37.507.575.183 1.1.157 1.513.096.46-.068 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"
          />
        </svg>
      </a>
    </div>
  );
}
