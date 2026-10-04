import { useSiteSettings } from '../lib/settings';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATE } from '../lib/legal';

// =========================================================================
// TÉRMINOS Y CONDICIONES — página pública, sin recargar la app: se muestra
// cuando la URL tiene #terminos (ver el enrutamiento por hash en main.tsx,
// mismo mecanismo que ya usa #admin).
// =========================================================================
export default function TerminosPage() {
  const { whatsappNumber } = useSiteSettings();
  const waUrl = `https://wa.me/${whatsappNumber}`;

  const linkClass = 'text-brand-blue font-semibold hover:underline';
  const WhatsappLink = () => (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
      +{whatsappNumber}
    </a>
  );
  const EmailLink = () => (
    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
      {CONTACT_EMAIL}
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
            TÉRMINOS Y CONDICIONES — TRESPA STORE
          </h1>
          <p className="text-xs text-slate-400 mb-8">Última actualización: {LEGAL_LAST_UPDATE}</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">1. General</h2>
              <p>
                Bienvenido a Trespa Store. Al acceder y utilizar este sitio web, aceptas cumplir con los siguientes
                Términos y Condiciones.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">2. Catálogo, pedidos y precios</h2>
              <p>
                Este sitio es un catálogo: muestra productos y precios, pero mostrarlos no es una oferta cerrada. El
                pedido solo queda en firme cuando lo confirmamos contigo por WhatsApp. Todos los productos están
                sujetos a disponibilidad al momento de esa confirmación, ya que Trespa Store no mantiene stock propio
                y trabaja bajo un modelo de encargo con proveedores. Los precios están expresados en pesos
                colombianos (COP).
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">3. Pagos</h2>
              <p>
                Este sitio no procesa pagos ni guarda datos de tarjetas ni de cuentas bancarias. El pago se coordina
                por WhatsApp una vez confirmado tu pedido: si pagas con tarjeta, te enviamos por WhatsApp un link de
                pago de Bold y pagas directamente en Bold; si prefieres transferencia, puedes pagar por Bancolombia,
                Nequi, Nu o Lulo Bank. Los pagos deben completarse en su totalidad antes del despacho del pedido.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">4. Envíos</h2>
              <p>
                Realizamos envíos a nivel nacional dentro de Colombia; no realizamos envíos internacionales. El
                envío es gratuito a la mayor parte del país; en municipios de difícil acceso puede cobrarse el valor
                del trayecto. El tiempo estimado de entrega es de 2 a 5 días hábiles, a través de Interrapidísimo o
                Coordinadora (en ocasiones Envía o Servientrega). Los plazos pueden variar según el destino y la
                operación de la empresa de transporte; pueden surgir demoras ajenas a Trespa Store por factores
                operativos, climáticos o de fuerza mayor. Ante cualquier inconveniente con el envío, colaboramos en
                la gestión del reclamo ante la transportadora correspondiente.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">5. Naturaleza de los productos</h2>
              <p>
                Los productos ofrecidos en Trespa Store son réplicas o versiones alternativas inspiradas en modelos
                de calzado deportivo, y no corresponden a mercancía original ni oficial de las marcas que puedan
                mencionarse en el catálogo. Trespa Store no es tienda oficial, distribuidor autorizado, ni tiene
                afiliación, patrocinio o relación comercial con dichas marcas. El uso de nombres o referencias a
                marcas de terceros en este sitio es únicamente con fines descriptivos, para identificar el modelo o
                estilo del producto ofrecido.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">6. Cambios por talla</h2>
              <p>
                Los cambios se realizan únicamente por talla, sujetos a disponibilidad en bodega, dentro de un plazo
                de 10 a 15 días hábiles contados desde la facturación del pedido en sistema. Es indispensable
                conservar la bolsa transparente y el código de barras del producto — sin él no es posible realizar
                el cambio. La mercancía solo se reserva una vez pagada en su totalidad. No realizamos cambios de
                referencia. No realizamos devoluciones de dinero, salvo error atribuible a Trespa Store (referencia, talla o color equivocado), en cuyo caso asumimos
                todos los costos del proceso de cambio.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">7. Garantía</h2>
              <p>
                La garantía legal por defectos del producto aplica siempre, y cuando procede el envío corre por
                cuenta de Trespa Store. Además, ofrecemos una garantía sobre pegues y costuras por un período de 1
                mes desde la entrega.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">
                8. Peticiones, quejas y reclamos
              </h2>
              <p>
                Puedes presentar cualquier petición, queja o reclamo por WhatsApp al <WhatsappLink /> o al correo{' '}
                <EmailLink />.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">9. Propiedad intelectual</h2>
              <p>
                El contenido de este sitio (diseño, textos propios y logotipo) es propiedad de Trespa Store. Las
                marcas de terceros mencionadas o referenciadas pertenecen a sus respectivos titulares.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">10. Privacidad</h2>
              <p>
                Nos comprometemos a proteger tu información personal. Consulta nuestra{' '}
                <a href="#privacidad" className={linkClass}>
                  Política de Tratamiento de Datos Personales
                </a>{' '}
                para más detalles.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">11. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Las
                modificaciones entran en vigor a partir de su publicación en el sitio web.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">12. Contacto</h2>
              <p>
                Para cualquier consulta, puedes escribirnos por WhatsApp al <WhatsappLink /> o al correo{' '}
                <EmailLink />.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
