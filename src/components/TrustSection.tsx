import { CheckCircle, Truck, Heart } from 'lucide-react';

// Sección de propuestas de valor y beneficios (Calidad / Envío / Atención).
// Contenido estático, no recibe props — extraída tal cual de App.tsx.
export default function TrustSection() {
  return (
    <section className="bg-white border-t border-b border-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="flex gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Referencias importadas</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ofrecemos zapatillas importadas con buen nivel de detalle y comodidad, a un precio accesible.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Envío Gratis</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Envío gratis a la mayor parte de Colombia (en municipios de difícil acceso se cobra el trayecto). Te enviamos la guía de rastreo por WhatsApp.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Atención por WhatsApp</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Chatea directamente con un asesor por WhatsApp para resolver tus dudas sobre tallas, disponibilidad y envíos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
