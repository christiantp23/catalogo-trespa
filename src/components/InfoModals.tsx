import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CreditCard, Ruler, Check, Info, Truck, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tallas' | 'politicas' | 'pagos' | 'transportes';
}

export default function InfoModals({ isOpen, onClose, initialTab = 'tallas' }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'tallas' | 'politicas' | 'pagos' | 'transportes'>(initialTab);

  // Sync active tab when modal is opened or parent requests a specific tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Sizes Data
  const tallasHombre = [
    { co: '37', us: '7', eur: '40', cm: '25' },
    { co: '38', us: '8', eur: '41', cm: '26' },
    { co: '39/40', us: '8.5/9', eur: '42', cm: '26.5' },
    { co: '41', us: '9.5', eur: '43', cm: '27' },
    { co: '42', us: '10', eur: '44', cm: '28' },
  ];

  const tallasMujer = [
    { co: '35', us: '5/5.5', eur: '36', cm: '22.5' },
    { co: '36', us: '6', eur: '37', cm: '23.5' },
    { co: '37', us: '6.5/7', eur: '38', cm: '24' },
    { co: '38', us: '7.5/8', eur: '39', cm: '25' },
  ];

  // Policies Data
  const politicas = [
    {
      num: 1,
      title: 'Cambios por Talla',
      text: 'Los cambios se realizan únicamente por talla, sujetos a disponibilidad en bodega, dentro de un plazo de 10 a 15 días hábiles, contados a partir del momento en que el pedido es facturado en sistema.',
    },
    {
      num: 2,
      title: 'Empaque y Código de Barras',
      text: 'Todos los pares se envían con una bolsa transparente y código de barras. Es indispensable conservar este código, ya que sin él no es posible realizar cambios de talla.',
    },
    {
      num: 3,
      title: 'Reserva de Mercancía',
      text: 'Trespa Store solo reserva mercancía que esté paga en su totalidad. No se realizan apartados sin pago.',
    },
    {
      num: 4,
      title: 'Productos sin Garantía',
      text: 'Los guayos no cuentan con garantía.',
    },
    {
      num: 5,
      title: 'Cambios y Devoluciones',
      text: '• No realizamos cambios de referencia.\n• No realizamos devoluciones de dinero, salvo en casos específicos o por error atribuible a Trespa Store.\n• No apartamos mercancía de un día para otro si no está paga.',
    },
    {
      num: 6,
      title: 'Garantía',
      text: 'La garantía cubre pegues y costuras, por un período de 1 mes de uso, contado desde la entrega del producto al cliente.',
    },
    {
      num: 7,
      title: 'Errores atribuibles a Trespa Store',
      text: 'Si el error es nuestro (referencia incorrecta, talla o color equivocado), Trespa Store asume todos los costos asociados al proceso de cambio.',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-charcoal/85 z-50 cursor-pointer animate-fade-in"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              id="info-modal-wrapper"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col relative max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-blue to-brand-blue/95 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
                    {activeTab === 'tallas' && <Ruler className="w-5 h-5" />}
                    {activeTab === 'politicas' && <ShieldCheck className="w-5 h-5" />}
                    {activeTab === 'pagos' && <CreditCard className="w-5 h-5" />}
                    {activeTab === 'transportes' && <Truck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg uppercase tracking-wider">
                      {activeTab === 'tallas' && 'Guía de Tallas'}
                      {activeTab === 'politicas' && 'Políticas de Compra'}
                      {activeTab === 'pagos' && 'Medios de Pago Autorizados'}
                      {activeTab === 'transportes' && 'Empresas de Transporte'}
                    </h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-sky">
                      Información 
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs Bar inside Modal */}
              <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto shrink-0 select-none scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('tallas')}
                  className={`flex-1 min-w-[110px] py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'tallas'
                      ? 'border-brand-blue text-brand-blue bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👟 Tallas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('politicas')}
                  className={`flex-1 min-w-[110px] py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'politicas'
                      ? 'border-brand-blue text-brand-blue bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📜 Políticas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pagos')}
                  className={`flex-1 min-w-[110px] py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'pagos'
                      ? 'border-brand-blue text-brand-blue bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💵 Medios de Pago
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transportes')}
                  className={`flex-1 min-w-[110px] py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                    activeTab === 'transportes'
                      ? 'border-brand-blue text-brand-blue bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🚚 Envíos / Transportes
                </button>
              </div>

              {/* Content Panel Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30">
                
                {/* 1. SIZE GUIDE TAB */}
                {activeTab === 'tallas' && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
                      <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="font-bold">¡Atención!</strong> En Colombia usualmente te guías por tu talla nacional habitual (CO). Utiliza esta tabla de equivalencias para comparar con tus medidas europeas (EUR) o americanas (US). El largo en centímetros (CM) corresponde al largo de la plantilla interna.
                      </p>
                    </div>

                    {/* Men Sizes */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-blue font-display">
                          Tallas de Hombre / Unisex
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                          CABALLERO
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">CO 🇨🇴</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">US 🇺🇸</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">EUR 🇪🇸</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Plantilla (CM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tallasHombre.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 text-center text-sm font-black text-brand-blue font-display">{row.co}</td>
                                <td className="p-3 text-center text-sm font-semibold text-slate-600">{row.us}</td>
                                <td className="p-3 text-center text-sm font-semibold text-slate-600">{row.eur}</td>
                                <td className="p-3 text-center text-sm font-bold text-emerald-600 bg-emerald-50/20">{row.cm} cm</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Women Sizes */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-blue font-display">
                          Tallas de Mujeres
                        </span>
                        <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md font-mono">
                          DAMA
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">CO 🇨🇴</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">US 🇺🇸</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">EUR 🇪🇸</th>
                              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Plantilla (CM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tallasMujer.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 text-center text-sm font-black text-brand-blue font-display">{row.co}</td>
                                <td className="p-3 text-center text-sm font-semibold text-slate-600">{row.us}</td>
                                <td className="p-3 text-center text-sm font-semibold text-slate-600">{row.eur}</td>
                                <td className="p-3 text-center text-sm font-bold text-emerald-600 bg-emerald-50/20">{row.cm} cm</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. POLICIES TAB */}
                {activeTab === 'politicas' && (
                  <div className="space-y-4">
                    <div className="bg-brand-charcoal text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-yellow block mb-0.5 font-mono">
                          Marco de la Garantías
                        </span>
                        <h4 className="font-display font-black text-base uppercase">Políticas Trespa Store</h4>
                      </div>
                      <span className="text-[10px] font-black bg-brand-yellow text-slate-950 px-3 py-1 rounded-lg uppercase tracking-wider">
                        Vigente
                      </span>
                    </div>

                    <div className="divide-y divide-slate-150 bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
                      {politicas.map((pol) => (
                        <div key={pol.num} className="py-3 first:pt-0 last:pb-0 flex gap-4">
                          <span className="w-7 h-7 rounded-lg bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center font-display font-black text-brand-blue shrink-0 text-xs">
                            {pol.num}
                          </span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              {pol.title}
                            </h5>
                            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line font-light">
                              {pol.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. PAYMENT METHODS TAB */}
                {activeTab === 'pagos' && (
                  <div className="space-y-6">
                    {/* Bold payment gateway */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <CreditCard className="w-4 h-4 text-brand-blue animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-blue font-display">
                          Paga Seguro con Bold
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Nuestra pasarela oficial de pago es <strong className="font-semibold text-brand-blue">Bold</strong>, autorizada y vigilada para garantizar total seguridad. Al enviar tu pedido, nuestro asesor te proporcionará un link único de Bold para procesar el pago al instante con cualquier tarjeta de crédito o débito nacional e internacional.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5">
                          <span className="text-sm font-black text-blue-800 tracking-tighter italic">VISA</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Crédito / Débito</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5">
                          <div className="flex items-center -space-x-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mastercard</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5">
                          <img
                            src="/pse.webp"
                            alt="Logo PSE"
                            loading="lazy" // Carga diferida para optimizar la lista del carrito
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-contain shadow-sm rounded-full bg-white"
                          />
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Cuentas Débito</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank transfers */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Landmark className="w-4 h-4 text-brand-blue" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-blue font-display">
                          Transferencias Directas (Colombia)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-amber-400" />
                            <h6 className="text-xs font-bold text-slate-900">Bancolombia</h6>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                            Transfiere de forma directa desde la app de tu banco. Solo envías el capture del comprobante por WhatsApp para confirmar y agendar despacho de inmediato.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-pink-500" />
                            <h6 className="text-xs font-bold text-slate-900">Nequi</h6>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                            Transfiere al instante usando nuestro número celular asignado. Método ágil, seguro, sin cargos adicionales de consignación nacional.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-purple-600" />
                            <h6 className="text-xs font-bold text-slate-900">Nu Colombia (La Moradita)</h6>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                            Transferencias seguras e inmediatas utilizando nuestra cuenta de ahorros Nu. Totalmente digital y con confirmación rápida.
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                            <h6 className="text-xs font-bold text-slate-900">Lulo Bank</h6>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                            Transferencias directas libres de gravamenes y costos. Facilitamos cuentas de última tecnología para agilizar tu compra.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

{/* 4. SHIPPING / TRANSPORT LOGISTICS TAB */}
{activeTab === 'transportes' && (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 text-blue-950">
      <Truck className="w-5 h-5 shrink-0 text-brand-blue mt-0.5" />
      <p className="text-xs font-medium leading-relaxed">
        <strong className="font-black">ENVÍO GRATIS A NIVEL NACIONAL.</strong> En Trespa Store cubrimos el costo del envío a la mayor parte del país. Para municipios de difícil acceso se cobra el valor del trayecto.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Interrapidisimo Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 hover:border-blue-200 transition-all flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-mono">
              Interrapidísimo
            </span>
            <span className="text-emerald-500 text-[10px] font-bold">Cobertura Total</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 font-display">Líder en Envíos Nacionales</h4>
          <div className="flex justify-center items-center py-4 bg-slate-50 rounded-xl">
            <img src="/logo-inter.webp" alt="Logo Interrapidísimo" loading="lazy" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-400 font-medium">
          <p>• Tiempo estimado: 2 a 5 días hábiles</p>
          <p>• Guía de Rastreo</p>
        </div>
      </div>

      {/* Coordinadora Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              Coordinadora
            </span>
            <span className="text-emerald-500 text-[10px] font-bold">Cobertura Total</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 font-display">Logística y Cuidado Extra</h4>
          <div className="flex justify-center items-center py-4 bg-slate-50 rounded-xl">
            <img src="/logo-coordi.webp" alt="Logo Coordinadora" loading="lazy" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-400 font-medium">
          <p>• Tiempo estimado: 2 a 5 días hábiles</p>
          <p>• Rastreo de guía</p>
        </div>
      </div>
    </div>

    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
      <Check className="w-5 h-5 text-emerald-600 shrink-0" />
      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
        <strong>¿Cómo rastrear tu pedido?</strong> Tan pronto despachemos te enviaremos el número de guía a tu WhatsApp. Aunque enviamos por lo general con Interrapidísimo y Coordinadora en ocasiones usamos Envía o Servientrega para asegurar la mejor ruta de entrega.
      </p>
    </div>
  </div>
)}

              </div>

               {/* Bottom buttons / tab selector */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Soporte activo por WhatsApp
                  </span>
                </div>
                <span className="text-xs font-bold text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  Trespa Store
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
