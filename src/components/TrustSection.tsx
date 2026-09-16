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
              <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Calidad Garantizada</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ofrecemos zapatillas importadas con un alto nivel de detalle, comodidad y excelente relación calidad-precio.
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
                Llegamos a cada rincón de Colombia sin costo adicional. Despachos rápidos con rastreo garantizado.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-sky/10 flex items-center justify-center text-brand-blue shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 uppercase">Atención Humana</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nada de bots aburridos. Chatea directamente con asesores apasionados por los tenis deportivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
