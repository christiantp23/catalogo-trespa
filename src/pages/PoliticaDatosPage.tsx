import { useSiteSettings } from '../lib/settings';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATE } from '../lib/legal';

// =========================================================================
// POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — página pública, sin recargar
// la app: se muestra cuando la URL tiene #privacidad (ver el enrutamiento
// por hash en main.tsx, mismo mecanismo que ya usa #admin).
// =========================================================================
export default function PoliticaDatosPage() {
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
            POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — TRESPA STORE
          </h1>
          <p className="text-xs text-slate-400 mb-8">
            Última actualización: {LEGAL_LAST_UPDATE} — En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de
            2013 (Colombia).
          </p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">1. Responsable del tratamiento</h2>
              <p>
                Trespa Store. Cali, Colombia. [PENDIENTE: nombre completo o razón social del responsable y su
                NIT/cédula]. Contacto: WhatsApp <WhatsappLink /> y correo <EmailLink />.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">2. Datos que recolectamos</h2>
              <p>
                Al enviar una solicitud de pedido en el sitio, te pedimos: nombre completo, número de cédula, correo
                electrónico, celular/WhatsApp, ciudad y dirección de entrega, y el método de pago que prefieres. De
                forma opcional puedes dejar observaciones. También guardamos lo que pediste (productos, talla, color,
                cantidad) y el total. La cédula la usamos para generar la guía de la transportadora. Si pagas por
                transferencia, el comprobante que nos envías por WhatsApp puede guardarse junto a tu pedido. No
                guardamos datos de tarjetas ni cuentas bancarias.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">3. Para qué los usamos</h2>
              <p>
                Usamos tus datos para: confirmar tu pedido y coordinar el pago por WhatsApp, despachar el envío,
                atender cambios y garantías, y limitar los pedidos repetidos desde un mismo teléfono (por seguridad,
                el sitio acepta un máximo de pedidos por hora por teléfono). No los usamos para otros fines.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">4. Con quién los compartimos</h2>
              <p>
                No vendemos, alquilamos ni compartimos tus datos para otros fines. Compartimos lo estrictamente
                necesario con la transportadora que entrega tu pedido y con el proveedor que lo despacha. Además
                intervienen estos servicios técnicos: Supabase (donde se almacenan los pedidos), WhatsApp (el chat
                donde envías tu pedido), Netlify (alojamiento del sitio), Google Fonts (tipografías) y Unsplash
                (imágenes de respaldo cuando falta una foto propia); estos dos últimos pueden recibir la dirección IP
                de tu dispositivo al cargar el sitio. Si pagas con tarjeta, lo haces directamente en la página de
                Bold, que maneja tus datos de pago bajo su propia política.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">5. Lo que queda en tu dispositivo</h2>
              <p>
                Para que la tienda funcione, tu navegador guarda tu carrito y tus favoritos (en el almacenamiento del
                navegador, no en nuestros servidores) y recuerda si ya viste la pantalla de carga. No usamos cookies
                ni herramientas de analítica o publicidad por ahora. Si en el futuro se activan, esta política se
                actualizará para reflejarlo.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">6. Tus derechos</h2>
              <p>
                Como titular de tus datos, tienes derecho a conocerlos, actualizarlos y rectificarlos; a solicitar
                prueba de la autorización otorgada; a ser informado sobre su uso; a presentar quejas ante la
                Superintendencia de Industria y Comercio (SIC); a revocar la autorización y/o solicitar la supresión
                de tus datos cuando no exista un deber legal que lo impida; y a acceder a ellos de forma gratuita.
                Puedes ejercer estos derechos por WhatsApp al <WhatsappLink /> o al correo <EmailLink />. Las
                consultas se responden en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">7. Autorización</h2>
              <p>
                Antes de enviar tu solicitud de pedido, el sitio te pide marcar una casilla donde autorizas
                expresamente a Trespa Store para tratar tus datos personales conforme a esta política.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">8. Conservación</h2>
              <p>
                Tus datos se conservan mientras sea necesario para las finalidades descritas, o hasta que solicites
                su supresión.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-1.5">9. Contacto</h2>
              <p>
                Para consultas o reclamos sobre tus datos: WhatsApp al <WhatsappLink /> o correo <EmailLink />.
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
