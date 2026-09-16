import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
    toasts: ToastNotification[];
    onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        // Contenedor flotante para los toasts
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
            <AnimatePresence>
                {toasts.map((toast) => {
                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-4 flex items-start gap-3.5 relative overflow-hidden group"
                        >
                            {/* Barra de progreso de auto-cierre */}
                            <div className="absolute bottom-0 left-0 h-[3px] bg-blue-600/30 w-full animate-toast-timer" />

                            {/* Icono del tipo de Toast */}
                            <div className={`p-2.5 rounded-xl shrink-0 ${toast.type === 'cart'
                                    ? 'bg-blue-50 text-blue-600'
                                    : toast.type === 'favorite_add'
                                        ? 'bg-red-50 text-red-500'
                                        : 'bg-slate-50 text-slate-500'
                                }`}>
                                {toast.type === 'cart' && <ShoppingBag className="w-5 h-5" />}
                                {toast.type === 'favorite_add' && <Heart className="w-5 h-5 fill-current" />}
                                {toast.type === 'favorite_remove' && <Heart className="w-5 h-5" />}
                            </div>

                            {/* Mensaje principal */}
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    {toast.type === 'cart'
                                        ? '¡Agregado al carrito!'
                                        : toast.type === 'favorite_add'
                                            ? '¡Guardado en favoritos!'
                                            : 'Quitado de favoritos'}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5 truncate font-semibold">
                                    {toast.productName}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {toast.message}
                                </p>
                            </div>

                            {/* Botón para cerrar manualmente */}
                            <button
                                type="button"
                                onClick={() => onClose(toast.id)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors duration-150 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}