import { useEffect, useState } from 'react';

// Id del contenedor de "Términos y condiciones" / "Tratamiento de datos
// personales", al final del footer (ver Footer.tsx). Se busca por
// document.getElementById en vez de pasar una ref por props porque los
// botones flotantes (WhatsApp, Telegram) y el Footer son componentes
// hermanos, montados por separado en App.tsx.
const FOOTER_LEGAL_LINKS_ID = 'footer-legal-links';

// Cuánto "adelanto" (en px) se le da al ocultamiento: los botones flotantes
// desaparecen un poco antes de que esa franja del footer entre realmente en
// pantalla, para que nunca lleguen a taparla ni un instante.
const HIDE_MARGIN_PX = 96;

// Hook chico y reusable: observa la franja final del footer con
// IntersectionObserver y devuelve true mientras esté (a punto de estar)
// visible, para que un botón flotante pueda ocultarse y no taparla.
export function useHideNearFooter(): boolean {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(FOOTER_LEGAL_LINKS_ID);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShouldHide(entry.isIntersecting),
      { rootMargin: `0px 0px ${HIDE_MARGIN_PX}px 0px` }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  return shouldHide;
}
