# Auditoría de código — Trespa Store (1 de octubre de 2026)

Alcance: `src/` (~11.200 líneas), `tests/`, `supabase/migrations`, configuración (`netlify.toml`, `vite.config.ts`, `tsconfig.json`, `package.json`) y el estado real de Supabase (políticas RLS y *advisors* de seguridad y rendimiento). Solo lectura. Método: skill `engineering:code-review` más consulta de políticas y advisors en Supabase. `npm run lint` (tsc) y `npm run build` pasan; los 4 tests e2e pasan.

## Veredicto
Base sólida para una tienda de este tamaño (CSP estricta, RLS, límite de pedidos, validaciones compartidas, admin diferido). Para llevarla "a la altura" faltan: cerrar un hueco de RLS, dejar de confiar en precios del cliente, activar `strict` en TypeScript con lint y CI, y accesibilidad de modales.

## Hallazgos prioritarios

| # | Sev. | Dónde | Hallazgo | Arreglo propuesto |
|---|---|---|---|---|
| 1 | Alta | RLS `order_items_insert_public` (`with_check: true`) | Cualquiera puede insertar filas en `order_items` sin límite. El rate limit solo protege `orders`. Con un pedido válido se pueden adjuntar miles de ítems con precios inventados. | Trigger `BEFORE INSERT` en `order_items` que limite ítems por pedido (p. ej. ≤ 20) y exija que el pedido sea `pendiente` y de los últimos minutos. |
| 2 | Alta | `orders.ts`, `CheckoutModal.tsx` | `total`, `price_at_time` y `product_name` los manda el navegador. El carrito guarda el objeto producto completo en `localStorage` (`trespa_cart`), así que si cambias un precio, un cliente puede llegar con el precio viejo, o uno manipulado. Hoy lo mitiga que la venta se confirma por WhatsApp. | Trigger que recalcule `total` y `price_at_time` desde `products`; al abrir el carrito, refrescar precios y avisar si cambiaron. |
| 3 | Alta | `tsconfig.json` | Sin `strict` (ni `noImplicitAny`, `strictNullChecks`). El type-check "pasa" pero no protege. Hay 3 `catch (e)` sin uso y datos de `localStorage` sin validar. | Activar `"strict": true` y corregir errores por etapas. Validar con un esquema (p. ej. zod) lo que se lee de `localStorage`. |
| 4 | Alta | `tests/`, `.github` ausente | Solo 4 tests e2e que pegan a la base real de producción; sin tests unitarios, ESLint, Prettier ni CI. | Proyecto Supabase de pruebas (o rama), unit tests para `validation.ts`/`orders.ts`, ESLint + GitHub Actions (lint, tsc, build, e2e). |
| 5 | Media | Modales (`CheckoutModal`, `InfoModals`, `CartSidebar`, `WishlistSidebar`, `ProductCard` lightbox) | Sin `role="dialog"`, `aria-modal`, atrapar foco ni cerrar con Escape (solo 2 modales del admin lo hacen). Solo 16 `aria-label` en todo el proyecto. | Componente `Modal` común con rol, foco, Escape y `aria-labelledby`. Pasar la skill `a11y-audit` después. |
| 6 | Media | RLS (advisor `multiple_permissive_policies`, 26 avisos) | Políticas `admin_write_*` de tipo `ALL` se solapan con `public_read_*` en `SELECT`, y `orders` tiene dos políticas `INSERT` para `authenticated`. Solo rendimiento. | Dividir `admin_write_*` en `INSERT`/`UPDATE`/`DELETE`. |
| 7 | Media | BD | FK `order_items.product_id` sin índice. Índices sin uso: `orders_confirmed_at_idx`, `idx_product_history_changed_at`. | Crear el índice faltante; evaluar borrar los no usados cuando haya tráfico real. |
| 8 | Media | Supabase Auth | Protección contra contraseñas filtradas desactivada. Sesión admin (`trespa_admin_session`) en `localStorage`; hoy la CSP `script-src 'self'` reduce el riesgo de robo por XSS. | Activar la protección (según el plan de Supabase); mantener CSP; considerar sesión de vida corta. |
| 9 | Media | `App.tsx:225-231` | Retraso artificial de 600 ms (skeleton) cada vez que cambias un filtro. | Quitarlo; mostrar skeleton solo en la carga real. |
| 10 | Media | `App.tsx:203-209` | "Orden" aleatorio con `Math.random()` por sesión: el catálogo cambia de orden en cada visita. | Orden determinista (destacados, más nuevos). |
| 11 | Media | Build | Un solo chunk principal de 514 kB (149 kB gzip). | Separar vendors (`motion`, `lucide`) con `manualChunks`; cargar perezosamente modales y testimonios. |
| 12 | Media | SEO | Navegación por hash (`#terminos`, `#privacidad`) no indexable; sin sitemap ni datos estructurados `Product`; meta tags estáticos. | Rutas reales con `_redirects` de Netlify, `sitemap.xml`, JSON-LD de producto, título y descripción por producto. |
| 13 | Baja | `Footer.tsx`, `FloatingTelegram.tsx`, `CatalogSection.tsx` | Número, redes, horario y Telegram fijos en el código, aunque `site_settings` tiene esos campos (en `null`). Si cambias el número en el panel, el Footer no se entera. | Leer todo desde `site_settings`. |
| 14 | Baja | Archivos gigantes | `ProductFormModal.tsx` (1.353 líneas), `ProductCard.tsx` (900), `AdminOrders.tsx` (870), `CheckoutModal.tsx` (772). Difíciles de mantener y probar. | Extraer subcomponentes y hooks (formulario de checkout, validación, lightbox). |
| 15 | Baja | `package.json` | (scripts `deploy`/`predeploy` de `gh-pages` ya eliminados). `clean` usa `rm -rf` (falla en Windows). `vite` duplicado en `dependencies` y `devDependencies`. `Trespa_Store_Presentacion.pptx` suelto en la raíz. | Limpiar scripts y dependencias. |
| 16 | Baja | 6 usos de `key={index}` | Pueden causar fallos de render en listas que cambian. | Usar ids estables. |
| 17 | Baja | Comentarios | Muchos comentarios didácticos extensos (p. ej. `App.tsx`, `CheckoutModal.tsx`) que explican React básico. | Dejar solo los que explican el "por qué". |

## Lo que ya está bien
- CSP estricta (`script-src 'self'`), headers de seguridad, sin `dangerouslySetInnerHTML`/`eval`, sin secretos (la anon key es pública por diseño).
- RLS en todas las tablas, políticas separadas público/admin, trigger anti-spam con bloqueo de concurrencia (`pg_advisory_xact_lock`), `.env*` ignorado.
- Renovación automática de la sesión de Supabase y reintento.
- Validaciones compartidas (`validation.ts`) y panel admin cargado por separado.
- Registro de pedido que no bloquea la venta si falla.

## Ruta sugerida
1. **Esta semana:** hallazgos 1 y 2 (migración SQL en Supabase, requiere tu aprobación), 8 y 9.
2. **Siguiente:** 3 y 4 (strict + ESLint + CI + entorno de pruebas), 5 (modal accesible) y 13.
3. **Después:** 6, 7, 10, 11, 12, 14, 15, 16, 17.
