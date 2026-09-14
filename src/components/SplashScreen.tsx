import { motion } from 'motion/react';
import { Sparkle} from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden select-none"
        >
            {/* Luces y ambientación de fondo ultra premium */}
            <div className="absolute -top-40 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />

            {/* Rejilla sutil técnica */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Silueta de Zapatilla Minimalista con animación */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: [0, -12, 0]
                    }}
                    transition={{
                        opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                        scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                        y: {
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut"
                        }
                    }}
                    className="relative mb-8"
                >
                    {/* Brillo dinámico detrás del calzado */}
                    <div className="absolute inset-x-0 -bottom-2 h-6 bg-brand-blue/30 rounded-full filter blur-xl scale-95 animate-pulse" />

                    {/* Imagen de calzado premium con filtro de sombra elegante */}
                    <img
                        src="/logo.webp"
                        alt="Trespa Sneaker Icon"
                        referrerPolicy="no-referrer"
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain relative z-10 select-none drop-shadow-[0_20px_35px_rgba(59,130,246,0.35)]"
                    />

                </motion.div>

                {/* Mensaje de Bienvenida */}
                <div className="space-y-3">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.2,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.35em] text-brand-blue uppercase"
                    >
                        <Sparkle className="w-3.5 h-3.5 text-brand-yellow animate-spin-slow" />
                        Catálogo Trespa Store
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.3,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="font-display text-2xl sm:text-3xl font-black tracking-[0.4em] sm:tracking-[0.5em] text-white uppercase translate-x-[0.2em]"
                    >
                        BIENVENIDO
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{
                            duration: 1,
                            delay: 0.5,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="h-[1px] w-16 bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent mx-auto"
                    />
                </div>
            </div>

            {/* Indicador de carga inferior minimalista */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                <div className="h-[2px] w-24 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: 'easeInOut'
                        }}
                        className="h-full w-12 bg-brand-blue rounded-full"
                    />
                </div>
            </div>
        </motion.div>
    );
}