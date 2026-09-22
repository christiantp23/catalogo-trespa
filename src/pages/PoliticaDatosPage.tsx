import { useSiteSettings } from '../lib/settings';

// =========================================================================
// POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — página pública, sin recargar
// la app: se muestra cuando la URL tiene #privacidad (ver el enrutamiento
// por hash en main.tsx, mismo mecanismo que ya usa #admin).
// =========================================================================
export default function PoliticaDatosPage() {
  const { whatsappNumber } = useSiteSettings();
  const waUrl = `https://wa.me/${whatsappNumber}`;

  const WhatsappLink = () => (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-semibold hover:underline">
      +{whatsappNumber}
    </a>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <img src="/logo-trimmed.webp" alt="Trespa Store" className="h-8 w-auto object-contain" />
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
          >
            ← Volver al inicio
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 sm:p-8">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-brand-blue mb-1.5">
            POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — TRESPA STORE
          </h1>
          <p className="text-xs text-slate-400 mb-8">
            Última actualización: 22 de septiembre de 2026 — En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377
            de 2013 (Colombia).
          </p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">1. Responsable del tratamiento</h2>
              <p>
                Trespa Store. Cali, Colombia. Contacto: WhatsApp <WhatsappLink />.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">2. Datos que recolectamos</h2>
              <p>
                Al realizar un pedido a través del sitio, recolectamos: nombre completo, número de cédula, número de
                teléfono/WhatsApp y ciudad de entrega. No almacenamos datos de tarjetas ni cuentas bancarias — el
                pago se procesa directamente por Bold o entre vos y tu banco.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">3. Finalidad</h2>
              <p>
                Usamos estos datos exclusivamente para procesar y confirmar tu pedido, contactarte por WhatsApp para
                coordinar pago y entrega, gestionar el envío, y dar cumplimiento a la garantía si aplica. No
                vendemos, alquilamos ni compartimos tus datos con terceros para otros fines, salvo con la
                transportadora encargada del envío, en la medida necesaria para entregarlo.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">4. Tus derechos</h2>
              <p>
                Como titular de tus datos, tenés derecho a conocerlos, actualizarlos y rectificarlos; a solicitar
                prueba de la autorización otorgada; a ser informado sobre su uso; a presentar quejas ante la
                Superintendencia de Industria y Comercio (SIC); a revocar la autorización y/o solicitar la supresión
                de tus datos cuando no exista un deber legal que lo impida; y a acceder a ellos de forma gratuita.
                Podés ejercer estos derechos escribiendo por WhatsApp al <WhatsappLink />.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">5. Autorización</h2>
              <p>
                Al completar el checkout y confirmar tu pedido, autorizás expresamente a Trespa Store para el
                tratamiento de tus datos personales conforme a esta política.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">6. Vigencia</h2>
              <p>
                Tus datos se conservan mientras sea necesario para las finalidades descritas, o hasta que solicites
                su supresión.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">7. Cookies y analítica</h2>
              <p>
                Al día de esta actualización, el sitio no utiliza cookies de terceros ni herramientas de analítica
                (Google Analytics u otras). Si en el futuro se activan, esta política se actualizará para
                reflejarlo.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">8. Contacto</h2>
              <p>
                Para consultas o reclamos sobre tus datos: WhatsApp al <WhatsappLink />.
              </p>
            </section>
          </div>
        </div>

        <p className="text-center mt-6">
          <a href="#terminos" className="text-xs font-semibold text-brand-blue hover:underline">
            ← Volver a Términos y Condiciones
          </a>
        </p>
      </main>
    </div>
  );
}
