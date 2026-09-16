import { Truck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  bannerText: string;
}

// Sección del Banner Principal (Hero). Extraída tal cual de App.tsx — el
// botón "Ver Catálogo" sigue usando document.getElementById('catalog-section')
// directo, no depende de ningún estado de App.
export default function Hero({ bannerText }: HeroProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="relative rounded-[40px] overflow-hidden shadow-2xl min-h-[420px] sm:min-h-[460px] md:min-h-[520px]">
        {/* Foto de fondo: dos modelos con hoodies y sneakers Trespa Store.
            object-position se ajusta por breakpoint porque el recorte que
            hace "cover" es muy distinto en mobile (imagen casi cuadrada,
            corta mucho a los costados -> center) que en desktop (imagen
            bastante más ancha que el contenedor, corta arriba/abajo ->
            subimos el foco al 25% para priorizar caras y logo del hoodie
            por sobre los tenis). Va PRIMERA en el DOM (detrás, sin
            z-index) para que el degradado y el texto pinten encima. */}
        <img
          src="/hero.webp"
          alt="Modelos usando hoodies y sneakers Trespa Store"
          // Es la imagen más grande del LCP (Largest Contentful Paint):
          // fetchpriority="high" + sin loading="lazy" le dicen al navegador
          // que la baje YA, en paralelo con el resto del HTML, en vez de
          // descubrirla recién cuando termina de parsear el DOM.
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_25%]"
        />

        {/* Degradado oscuro para legibilidad del texto: más cerrado a la
            izquierda (donde va el texto) y transparente hacia la derecha
            (donde están los modelos). En mobile el texto ocupa casi todo
            el ancho, así que el degradado también cubre más superficie. */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 sm:via-slate-950/40 to-slate-950/20 sm:to-transparent" />

        {/* absolute inset-0 (no "relative h-full"): el padre solo define
            min-height, no height, así que un hijo en flujo normal con
            h-full cae en una referencia circular y el navegador lo
            resuelve como "auto" — el bloque de texto terminaba con la
            altura de su propio contenido en vez de la altura real del
            Hero, por eso "items-center" no tenía espacio donde centrar.
            Con absolute inset-0 este div toma la altura real del padre
            (fijada por min-h-[...] más arriba) y el centrado vertical
            funciona de verdad. */}
        <div className="absolute inset-0 z-10 flex items-center p-8 sm:p-10 md:p-12">
          <div className="w-full sm:w-[85%] md:w-[58%] space-y-5 text-left">
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
              className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed font-light"
            >
              Renueva tu colección con los tenis que están rompiendo las redes. Referencias seleccionadas para darte el mejor look y la mayor comodidad en cada salida.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                type="button"
                onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-2 bg-white hover:bg-brand-yellow text-slate-900 font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-full shadow-lg transition-colors cursor-pointer"
              >
                Ver Catálogo
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Tarjeta flotante de marca (gráfico "23 Trespa Code"), NO de
            producto — misma posición/estilo que la referencia anterior
            (fondo oscuro semi-transparente con blur), pero mostrando el
            lema en vez de datos de un producto destacado. */}
        {/* "Respiración" sutil y continua en la tarjeta entera (fondo +
            imagen), con transition por propiedad: opacity/y son la
            entrada única (delay 0.4s, sin repeat), scale es el loop
            infinito. Mismo patrón exacto que ya usa SplashScreen.tsx
            (línea ~28) para combinar una animación de entrada con un
            loop en el mismo elemento. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.03, 1] }}
          transition={{
            opacity: { delay: 0.4 },
            y: { delay: 0.4 },
            scale: { delay: 0.4, duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-10 bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl"
        >
          <img
            src="/lema.webp"
            alt="Como el 23 - Trespa Code"
            referrerPolicy="no-referrer"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
