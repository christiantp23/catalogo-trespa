# Auditoría del módulo "Nosotros" — Trespa Store (5 de octubre de 2026)

Solo lectura. No se modificó código.

## Qué es hoy el módulo "Nosotros"
No existe una sección ni página "Nosotros". Lo que hay es:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Botón "Nosotros" (icono de personas) | `Navbar.tsx:182-192` | Abre `InfoModals` en la pestaña **Políticas** |
| Modal de información (4 pestañas: Tallas, Políticas, Medios de pago, Envíos) | `InfoModals.tsx` (471 líneas) | Contenido de compra, no de "quiénes somos" |
| Enlaces del Footer (Tallas, Políticas 2026, Medios de Pago) | `Footer.tsx:70-88` | Abren el mismo modal |
| Estado y apertura | `App.tsx:96-102`, `:647` | `infoModalOpen`, `infoModalTab`, `openInfoModal` |
| Bloques relacionados | `TrustSection.tsx`, `FloatingWhatsapp.tsx`, `FloatingTelegram.tsx`, `useHideNearFooter.ts` | Propuesta de valor y contacto |

## Hallazgos

| # | Sev. | Dónde | Hallazgo | Arreglo propuesto |
|---|---|---|---|---|
| 1 | Alta | `Navbar.tsx:185-187` | El botón dice "Nosotros" pero abre **Políticas de Compra**. El cliente espera saber quién es Trespa Store y recibe reglas de cambios. No hay contenido de marca (quiénes somos, ciudad, horario, cómo comprar) en ningún lado. | Decidir: renombrar el botón a "Políticas / Ayuda", o crear de verdad el contenido "Nosotros" (quiénes somos, Cali, cómo comprar, contacto, horario). |
| 2 | Alta | `InfoModals.tsx` completo | Cero accesibilidad: sin `role="dialog"`, `aria-modal`, `aria-labelledby`; no cierra con Escape; no atrapa ni devuelve el foco; la página de fondo sigue desplazándose; el botón de cerrar solo tiene `title`. Las pestañas no usan `role="tablist"`/`tab`/`aria-selected`. | Componente `Modal` común (rol, foco, Escape, bloqueo de scroll) y pestañas accesibles. Mismo hallazgo 5 de la auditoría general. |
| 3 | Alta | `Navbar.tsx:183-191` | En pantallas menores a `lg` el botón es solo un icono: sin texto ni `aria-label` (el `title` no sirve en celular). Un lector de pantalla no sabe qué es. | Añadir `aria-label` y, en móvil, texto o tooltip visible. |
| 4 | Media | `InfoModals.tsx:38-69` y `TerminosPage.tsx` | Las políticas están escritas **dos veces** (modal y Términos). Ya pasó una vez que se desalinearon (plazos de cambio, retracto). El punto 3 "Reserva" y el 4 repiten "No apartamos mercancía sin pago". | Una sola fuente de textos en `src/lib/legal.ts` usada por ambos; quitar la frase repetida. |
| 5 | Media | `InfoModals.tsx:22-35` y `ProductFormModal.tsx:60-74` | Las tablas de tallas están duplicadas en el modal público y en el panel admin. | Mover la tabla a un solo módulo compartido. |
| 6 | Media | `InfoModals.tsx:310-326` | La pestaña de pagos muestra VISA, Mastercard (dibujados con CSS) y el logo PSE "Cuentas Débito". El texto de al lado solo habla de tarjeta crédito/débito vía Bold; PSE como medio aceptado no está respaldado en ningún texto ni en el sistema. Son marcas de terceros usadas sin autorización clara. | Confirmar qué acepta realmente Bold en tu cuenta y quitar PSE/logos si no aplica; si no, dejar solo texto. |
| 7 | Media | `InfoModals.tsx:394-445` | Los logos de Interrapidísimo y Coordinadora (`public/logo-inter.webp`, `logo-coordi.webp`) sugieren alianza o patrocinio. | Dejar solo el nombre en texto o confirmar el permiso de uso. |
| 8 | Media | `Footer.tsx:67` | La columna se llama "Colecciones", pero contiene Tallas, Políticas y Medios de Pago. La pestaña **Envíos** solo se alcanza abriendo el modal y cambiando de pestaña; no hay acceso directo. "Políticas 2026" fija el año. | Renombrar la columna ("Ayuda"), agregar el enlace a Envíos y quitar el año. |
| 9 | Media | `Footer.tsx:97,108,34-52,101-103`, `FloatingTelegram.tsx:28`, `CatalogSection.tsx:143` | Teléfono, redes, horario y Telegram están fijos en el código, aunque `site_settings` tiene esos campos (en `null`). Cambiar el número en el panel no actualiza el Footer. | Leer todo desde `site_settings`. |
| 10 | Baja | `InfoModals.tsx:98-113` | El encabezado muestra siempre "Información" y el título cambia por pestaña con ternarios repetidos; "Medios de Pago **Autorizados**" sugiere una certificación que no existe. | Un mapa de pestañas (título, icono, contenido) y título neutro. |
| 11 | Baja | `FloatingWhatsapp.tsx`, `FloatingTelegram.tsx`, `InfoModals.tsx:305` | Animaciones continuas (`animate-ping`, `animate-pulse`) sin respetar `prefers-reduced-motion`. Los botones flotantes no tienen `aria-label` (solo `title`). | Respetar la preferencia de movimiento reducido y añadir `aria-label`. |
| 12 | Baja | `useHideNearFooter.ts:21-23` | Busca `footer-legal-links` solo una vez al montar. Si el Footer no estuviera montado todavía, los botones flotantes nunca se ocultarían. Hoy funciona porque ambos están en `App`. | Documentarlo o usar una ref compartida. |
| 13 | Baja | `InfoModals.tsx` | Los arreglos (`tallasHombre`, `tallasMujer`, `politicas`) se recrean en cada render; `React` y alguno de los iconos importados pueden estar sin uso. | Moverlos fuera del componente. |
| 14 | Baja | `tests/` | Ningún test cubre el modal de información ni el botón "Nosotros". | Un test e2e que abra el modal, cambie de pestaña y lo cierre con Escape. |

## Lo que está bien
- El modal carga las imágenes con `loading="lazy"` y cierra al hacer clic fuera.
- Los textos de cambios, garantía, pagos y envíos ya coinciden con los Términos y no prometen pago en línea.
- `useHideNearFooter` evita que los botones flotantes tapen los enlaces legales.

## Ruta sugerida
1. Decidir qué es "Nosotros" (hallazgo 1): renombrar o crear contenido.
2. Accesibilidad del modal y del botón (2, 3, 11).
3. Una sola fuente de textos y de tallas (4, 5).
4. Revisar logos y medios de pago con el dueño (6, 7).
5. Limpiar Footer y datos fijos (8, 9, 10, 12, 13) y agregar el test (14).
