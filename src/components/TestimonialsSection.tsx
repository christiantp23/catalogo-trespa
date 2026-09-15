import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Heart, Star, CheckCheck, Smile, Paperclip, Camera, Mic, Play, Pause,
    Phone, Video, MoreVertical, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchTestimonials } from '../lib/testimonials';

// =========================================================================
// 6. SECCIÓN DE TESTIMONIOS INTERACTIVA CON CARRUSEL Y VIDEO (TestimonialsSection)
// =========================================================================
// Hemos transformado esta sección en un Carrusel Horizontal Interactivo.
// Ahora soporta tanto capturas de chat reales de WhatsApp como video-testimonios de clientes
// reproduciéndose interactivamente dentro de los chasis de los teléfonos celulares virtuales.

interface ChatTestimonial {
    id: string;
    clientName: string;
    phoneColor: string; // Color para personalizar los botones físicos del celular mockup
    chatScreenshot?: string; // Captura de pantalla real del chat de WhatsApp
    videoUrl?: string; // URL del video testimonial/unboxing
    isVideo?: boolean; // Booleano para activar el reproductor de video interactivo
}

// Subcomponente de Celular con reproductor interactivo incorporado
function TestimonialPhone({ chat, isActive }: { chat: ChatTestimonial; isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    // Reproducir/Pausar automáticamente cuando cambia la diapositiva activa
    useEffect(() => {
        if (!chat.isVideo) return;

        if (isActive) {
            // Intentar reproducir el video cuando esta diapositiva se activa
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(() => {
                        setIsPlaying(false);
                    });
            }
        } else {
            // Pausar si no está activa
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive, chat.isVideo]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        if (duration > 0) {
            setProgress((current / duration) * 100);
        }
    };

    return (
        <div className="relative w-full max-w-[315px] transition-all duration-300">

            {/* Botones Físicos Izquierdos (Volumen) */}
            <div className="absolute top-28 -left-2.5 w-1 h-12 bg-slate-800 rounded-l-md z-10" />
            <div className="absolute top-44 -left-2.5 w-1 h-12 bg-slate-800 rounded-l-md z-10" />

            {/* Botón Físico Derecho (Encendido / Botón de Color Personalizado) */}
            {/* phone_color viene de Supabase como clase de Tailwind (ej. 'bg-amber-400')
                o, si se eligió "Personalizado" en el admin, como hex (ej. '#F59E0B') */}
            <div
              className={`absolute top-32 -right-2.5 w-1 h-16 rounded-r-md z-10 shadow-sm transition-colors ${
                chat.phoneColor.startsWith('#') ? '' : chat.phoneColor
              }`}
              style={chat.phoneColor.startsWith('#') ? { backgroundColor: chat.phoneColor } : undefined}
            />

            {/* Chasis Exterior del Celular */}
            <div className="relative rounded-[48px] border-[10px] border-slate-900 bg-slate-950 p-1 shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">

                {/* Cámara Frontal / Notch Dinámico */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5.5 bg-slate-950 rounded-full z-40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800/40 mr-1.5 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-blue-900/50" />
                    </div>
                    <div className="w-8 h-0.5 bg-slate-800 rounded-full" />
                </div>

                {/* Pantalla del Celular */}
                <div className="relative rounded-[38px] overflow-hidden bg-slate-950 h-[520px]">

                    {/* Brillo de Cristal Reflejado */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-30" />

                    {chat.isVideo && chat.videoUrl ? (
                        <div className="relative w-full h-full bg-slate-900 flex flex-col justify-between cursor-pointer" onClick={togglePlay}>

                            {/* Reproductor de Video */}
                            <video
                                ref={videoRef}
                                src={chat.videoUrl}
                                loop
                                muted={isMuted}
                                playsInline
                                onTimeUpdate={handleTimeUpdate}
                                className="absolute inset-0 w-full h-full object-cover select-none"
                            />

                            {/* Header de Video (Apariencia de WhatsApp Status / Instagram Story) */}
                            <div className="relative z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-8 pb-4 px-4 flex justify-between items-center text-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <div>
                                        <h4 className="font-bold text-[11px] leading-none">
                                            {chat.clientName}
                                        </h4>
                                        <p className="text-[8px] text-white/80 font-light mt-0.5">
                                            reproduciendo unboxing...
                                        </p>
                                    </div>
                                </div>

                                {/* Badge de video testimonial */}
                                <span className="text-[8px] bg-amber-400 text-slate-950 font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                                    VIDEO
                                </span>
                            </div>

                            {/* Botón Central de Play/Pause (Visual cuando está pausado) */}
                            <AnimatePresence>
                                {!isPlaying && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Controles de la parte inferior */}
                            <div className="relative z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-8 pb-5 px-4 mt-auto">
                                {/* Barra de Progreso */}
                                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mb-3.5">
                                    <div
                                        className="h-full bg-brand-yellow transition-all duration-100 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-white">
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-bold">
                                        <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                                        <span>¡Cliente de Trespa!</span>
                                    </div>

                                    {/* Botón de Audio Mute/Unmute */}
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs transition-colors border border-white/10 flex items-center justify-center cursor-pointer"
                                        title={isMuted ? "Activar sonido" : "Silenciar"}
                                    >
                                        {isMuted ? (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={chat.chatScreenshot}
                            alt={`Chat de ${chat.clientName}`}
                            loading="lazy" // Carga diferida para optimizar la lista del carrito
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TestimonialsSection() {
    // 1. ESTADO DEL CARRUSEL: Almacena el índice de la tarjeta activa actual (0, 1, 2, etc.)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Los testimonios ahora vienen de Supabase (antes eran un arreglo fijo acá) —
    // se pueden agregar, reordenar o quitar desde el panel de administración,
    // sin tocar código.
    const [testimonials, setTestimonials] = useState<ChatTestimonial[]>([]);

    useEffect(() => {
        fetchTestimonials()
            .then((rows) => {
                setTestimonials(
                    rows.map((t) => ({
                        id: t.id,
                        clientName: t.client_name,
                        phoneColor: t.phone_color,
                        chatScreenshot: t.chat_screenshot || undefined,
                        videoUrl: t.video_url || undefined,
                        isVideo: t.is_video,
                    }))
                );
            })
            .catch(() => {
                // si falla la conexión, simplemente no se muestra la sección
            });
    }, []);

    // 3. FUNCIONES DE NAVEGACIÓN DEL CARRUSEL
    // - handlePrev: Retrocede una posición. Si está en la primera (0), da la vuelta al final.
    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    // - handleNext: Avanza una posición. Si está en la última, regresa al principio (0).
    const handleNext = () => {
        setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    // Si todavía no cargaron testimonios (o no hay ninguno cargado en el panel),
    // no mostramos la sección en vez de mostrarla rota/vacía.
    if (testimonials.length === 0) return null;

    return (
        <section id="testimonials-section" className="py-24 bg-slate-150 border-t border-slate-200 relative overflow-hidden">

            {/* Fondo decorativo con luces difuminadas (Glows) */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Encabezado Principal */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-brand-blue font-mono text-xs font-black tracking-widest uppercase bg-blue-50 py-2 px-5 rounded-full border border-blue-100 shadow-xs inline-flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Evidencia Real y Transparente
                    </span>
                    <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 uppercase tracking-tight mt-5">
                        ESTILO EN CADA PASO
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed max-w-2xl mx-auto">
                        Mira las reacciones de quienes ya compraron. Desliza para explorar capturas de pantalla de WhatsApp y videos de las zapatillas al llegar a su destino.
                    </p>
                </div>

                {/* =========================================================================
           CONTENEDOR DE CARRUSEL CON BOTONES DE NAVEGACIÓN
           =========================================================================
           - Colocamos flechas absolutas a los lados en pantallas grandes para deslizar.
           - El contenedor principal tiene un ancho fijo centrado y desborde oculto (overflow-hidden)
             para que las tarjetas que estén a los lados no sean visibles.
        */}
                <div className="relative max-w-lg mx-auto px-4 sm:px-10 py-6">

                    {/* Botón de Retroceso (Izquierda) */}
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-[-15px] sm:left-[-35px] top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-blue border border-slate-200 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Anterior testimonio"
                    >
                        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Botón de Avance (Derecha) */}
                    <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-[-15px] sm:right-[-35px] top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-blue border border-slate-200 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Siguiente testimonio"
                    >
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Ventana de visualización del Carrusel */}
                    <div className="overflow-hidden rounded-[36px] p-2">
                        {/* 
              Contenedor Deslizable de Framer Motion.
              - Animamos la propiedad `x` (eje horizontal) basada en el `currentIndex`.
              - El valor se calcula dinámicamente multiplicando el índice por -100%.
              - Usamos una transición tipo "spring" (resorte) para que tenga un rebote físico ultra suave y natural.
            */}
                        <motion.div
                            animate={{ x: `-${currentIndex * 100}%` }}
                            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                            className="flex w-full"
                        >
                            {testimonials.map((chat, index) => (
                                <div
                                    key={chat.id}
                                    className="w-full shrink-0 flex justify-center px-2"
                                >
                                    <TestimonialPhone chat={chat} isActive={currentIndex === index} />
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* =========================================================================
PUNTOS INDICADORES DE NAVEGACIÓN (Pagination Dots)
=========================================================================
        - Mostramos un círculo por cada testimonio.
        - El punto correspondiente al currentIndex activo se verá más ancho y azul
            para dar feedback visual inmediato al usuario de en qué página se encuentra.
        */}
                <div className="flex justify-center items-center gap-2.5 mt-8">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentIndex === index
                                ? 'w-7 bg-brand-blue shadow-xs shadow-blue-500/20'
                                : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                                }`}
                            aria-label={`Ir al testimonio ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Letras gigantes decorativas en la parte inferior */}
                <div className="text-center mt-12 select-none pointer-events-none opacity-50">
                    <h3 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-widest text-brand-yellow">
                        TRESPA STORE
                    </h3>
                </div>

                {/* Pie de página interior de testimonios */}
                <div className="text-center mt-8">
                    <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5 flex-wrap">
                        <span>Únete a los más de</span>
                        <span className="text-slate-900 bg-white border border-slate-150 py-0.5 px-2 rounded-md shadow-xs font-bold">1,500+ clientes</span>
                        <span className="flex items-center gap-1.5">
                            <span>satisfechos en toda Colombia</span>
                            <span className="inline-flex flex-col w-5 h-3.5 rounded-xs overflow-hidden shadow-xs border border-slate-200/50 shrink-0 select-none" title="Colombia">
                                <span className="bg-[#FCD116] h-1/2 w-full" />
                                <span className="bg-[#003893] h-1/4 w-full" />
                                <span className="bg-[#CE1126] h-1/4 w-full" />
                            </span>
                        </span>
                    </p>
                </div>
            </div>
        </section>
    );
}
