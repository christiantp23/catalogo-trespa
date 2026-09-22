import { Instagram, Facebook, Ruler, ShieldCheck, CreditCard, Clock } from 'lucide-react';

interface FooterProps {
  openInfoModal: (tab: 'tallas' | 'politicas' | 'pagos' | 'transportes') => void;
}

// Footer del sitio. Extraído tal cual de App.tsx, salvo los 3 links de
// categorías (Urbanos/Deportivos/Ediciones Especiales) que llamaban a
// setSelectedCategory con valores fijos — no eran las categorías reales, se
// sacaron por completo hasta que se definan. La columna "Colecciones" no
// queda vacía: conserva los otros 3 links (Guía de Tallas, Políticas,
// Medios de Pago), así que el título se mantiene.
export default function Footer({ openInfoModal }: FooterProps) {
  return (
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
              {/* Íconos alineados uniformemente */}
              <li>
                <button type="button" onClick={() => openInfoModal('tallas')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  <span>Guía de Tallas</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openInfoModal('politicas')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Políticas 2026</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openInfoModal('pagos')} className="text-brand-sky hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
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
                <p className="text-slate-300 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Horario de atención:</p>
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

        {/* Copyright, terms. text-slate-400 (no slate-500): sobre el fondo
            casi negro del footer (bg-slate-950), slate-500 quedaba al
            límite del contraste mínimo — acá hace falta un gris MÁS claro,
            al revés que en las secciones de fondo blanco. */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-light text-center sm:text-left">
          <p>© 2026 Trespa Store. Todos los derechos reservados. Desarrollado por Trespa Store</p>
          {/* id observado por useHideNearFooter: los botones flotantes de
              WhatsApp/Telegram se ocultan cuando esta franja entra en
              pantalla, para no taparla. */}
          <div id="footer-legal-links" className="flex gap-4">
            <a href="#terminos" className="hover:text-slate-300">Términos y condiciones</a>
            <span>•</span>
            <a href="#privacidad" className="hover:text-slate-300">Tratamiento de datos personales</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
