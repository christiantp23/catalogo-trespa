# Informe técnico — Trespa Store (2026-09-21)

Alcance: `src/` (tienda pública + panel admin + `lib/`), `package.json`, `netlify.toml`, `playwright.config.ts`.
Parte 1 = testing de 3 features (con servidor local temporal, ya apagado). Parte 2 = auditoría **solo lectura** (no se modificó ningún archivo de código).

> Nota: en esta sesión no tuve el documento "Conocimiento del proyecto". Usé como "pendientes ya conocidos" solo los ejemplos que me diste (anon key hardcodeada, catálogo vacío, Bold sin decidir, protección de contraseñas filtradas). Si hay más decisiones documentadas, algún "hallazgo nuevo" de abajo podría ya estar cubierto.

---

## PARTE 1 — Tests de las 3 features

**Archivo nuevo:** `tests/admin-features.spec.ts` (no se tocó `tests/checkout.spec.ts`). Login por API + sesión de admin sembrada en `localStorage` para abrir `/#admin`, datos de prueba con prefijo `TEST AUTOMATIZADO ADMIN` y limpieza en `finally`.

| # | Test | Resultado |
|---|------|-----------|
| 1 | **Costo y margen**: crea un producto por el formulario real con costo 120.000 → verifica la fila en `product_costs` → reabre "Editar" y confirma que el costo se precarga → crea orden confirmada (2 × 200.000) → la card "Margen estimado (mes)" coincide con el cálculo independiente hecho contra Supabase | PASÓ |
| 2 | **Comprobante**: orden pendiente → sube imagen desde el detalle → `payment_proof_url` queda guardado → se muestra la miniatura (con `target="_blank"`) | PASÓ |
| 3 | **Cliente recurrente**: 2 órdenes confirmadas con la misma cédula → la segunda muestra "Cliente recurrente — 1 compra confirmada antes"; un cliente con una sola compra no muestra el mensaje | PASÓ |

- Corrida final: 3/3 pasan (~26 s). Servidor `vite preview` levantado solo para el test y apagado (puerto 4173 verificado libre).
- Verificación posterior: 0 órdenes y 0 productos `TEST*` quedaron en Supabase.
- **Bugs en las 3 features: ninguno encontrado.**
- **Ajuste mínimo (solo en el test, no en la app):** el borrado del comprobante en Storage fallaba en la primera corrida porque enviaba `Content-Type: application/json` en un `DELETE` sin cuerpo. Se corrigió en el test y el archivo huérfano de esa primera corrida se borró a mano. La segunda corrida no dejó residuos.
- Los tests pegan a la base **real** (no hay staging); están hechos para no dejar rastro, pero si una limpieza fallara, los datos se reconocen por el prefijo.

---

## PARTE 2 — Auditoría

### 2.1 Seguridad de código

**Importante — hallazgo nuevo**
- **CSP bloquea los videos de Testimonios en producción.** `netlify.toml` no define `media-src`, así que cae en `default-src 'self'`; `TestimonialsSection.tsx:122` reproduce `<video src=…supabase.co/…>`. En local (sin headers de Netlify) funciona, en Netlify el video quedaría bloqueado. Falta `media-src 'self' https://hdxcyvczbhmemjbdkjdh.supabase.co`.
- **CSP sin `blob:` en `img-src` → el optimizador de imágenes falla en silencio en producción.** `imageOptimizer.ts` carga la foto con `URL.createObjectURL` en un `Image`; con el CSP actual eso se bloquea, `optimizeImage` cae en su `catch` y sube el original sin redimensionar/convertir a WebP (sin ningún aviso). Solo se nota en el peso de las fotos. Mismo archivo de config que el punto anterior.

**Menor — hallazgo nuevo**
- `refreshSession()` (`supabase.ts`) no es single-flight: si varias peticiones reciben 401/403 a la vez (el polling de Ventas + otras acciones), lanzan refrescos en paralelo con el mismo refresh token, lo que con rotación de tokens puede invalidar la sesión. Además, cualquier 403 legítimo de RLS (no solo token vencido) dispara un refresh + reintento innecesario.
- `clearSession()` solo borra `localStorage`; no llama a `/auth/v1/logout`, así que el refresh token sigue válido en el servidor tras "Cerrar sesión".
- Tokens de sesión en `localStorage` (esperable sin backend propio; el `script-src 'self'` del CSP es la mitigación real, y sin `dangerouslySetInnerHTML`/`eval` en todo `src/`).
- Validación de `cost_price` (feature nueva): el campo acepta negativos (`type="number"` sin mínimo, sin `validatePositivePrice`-like). Un costo negativo inflaría el margen.
- `telegramLink` / links de redes vienen de la base y se renderizan en `href` sin re-validar el esquema en el lado público (`App.tsx:487`); hoy solo el admin escribe (validado con `validateHttpsUrl`), así que es defensa en profundidad.
- El checkout público inserta `total` y `price_at_time` que manda el cliente (`orders.ts`); mitigado porque el dueño confirma cada venta a mano. Un control real sería del lado de la base (fuera de alcance, ya auditado por vos).
- Datos sensibles en el bundle: solo la anon key (ver "pendientes conocidos"). Sin otras claves ni credenciales en `src/`. `.env*` está en `.gitignore`.

**Pendientes ya conocidos — siguen igual**
- Anon key hardcodeada en `src/lib/supabase.ts` (y repetida en los tests): sigue así, es intencional.
- Protección de contraseñas filtradas: es de Supabase, no verificable desde código.

### 2.2 Consistencia y deuda técnica

**Importante — hallazgo nuevo**
- **Guardado de producto no atómico → un reintento puede duplicar el producto.** `ProductFormModal.handleSubmit` crea el producto, luego colorways/tallas, luego (nuevo) el costo. Si algo falla después de `createProduct`, el modal queda abierto en modo "crear" y volver a apretar guardar crea **otro** producto. Aplica a colorways (ya existía) y ahora también al paso del costo; el fallo del costo debería ser no fatal o conservar el `productId` recién creado.

**Menor — hallazgo nuevo**
- Código duplicado: `PHASE_LABEL` copiado en 3 archivos (+ `PROOF_UPLOAD_PHASE_LABEL` en `AdminOrders`); `escapeCsvValue` en `AdminDashboard` y `AdminOrders`; `formatPrice`/`Intl.NumberFormat` repetido en varios componentes; flujo de subida de archivo (estado uploading/phase/`e.target.value=''`) repetido en 4 lugares.
- `alert()`/`confirm()` nativos: 13 usos (Dashboard 5, Orders 5, Testimonials 2, ColorwayManager 1) aunque ya existe `ConfirmModal`; inconsistente entre pestañas y bloqueante.
- Archivos muy grandes: `ProductFormModal.tsx` (1286 líneas), `ProductCard.tsx` (900), `AdminOrders.tsx` (~870), `CheckoutModal.tsx` (731), `App.tsx` (644).
- `AdminOrders.load()` pone `loading=true` y reemplaza toda la lista por "Cargando ventas..." tras cada acción (confirmar, cancelar, adjuntar comprobante), en vez de refrescar sin parpadeo.
- El polling de Ventas (cada 50 s) sigue corriendo con la pestaña del navegador oculta.
- `package.json`: el script `deploy` usa `gh-pages`, que no está instalado; `clean` usa `rm -rf` (no funciona en Windows); `vite` está duplicado en `dependencies` y `devDependencies`; `autoprefixer` y `esbuild` sin uso aparente con Tailwind v4/Vite; quedan restos de la plantilla (`metadata.json`, referencia a `server.js`). README de 61 líneas sin instrucciones de deploy/test.
- `tsconfig.json` sin `strict` ni `noUnusedLocals`: `tsc` pasa limpio en parte porque casi no chequea.

**Pendientes ya conocidos — siguen igual**
- `ColorwayManager.tsx`: sigue sin usarse (nada lo importa).
- `data.ts`: **ya no existe** en `src/` (nada para borrar).
- Bold sin decidir: el checkout sigue ofreciendo `bold_tarjeta` y el mensaje de WhatsApp dice "Pasarela Segura Bold" sin integración real.

### 2.3 Tipos y errores estáticos
- `npm run lint` (`tsc --noEmit`): **0 errores, 0 warnings.** (Con la salvedad de la config poco estricta de arriba.)

### 2.4 Dependencias (`npm outdated` / `npm audit`, solo lectura)
- `npm audit`: **4 vulnerabilidades (3 altas, 1 moderada)**: `browserslist`, `postcss`, `nanoid`, `baseline-browser-mapping`. Todas son herramientas de **build/dev transitivas**, no viajan en el bundle del cliente; `npm audit fix` las resolvería (no lo corrí).
- Desactualizados (mayormente saltos de versión mayor): `vite` 6→8, `@vitejs/plugin-react` 5→6, `lucide-react` 0.546→1.47, `motion` 12→13, `typescript` 5.8→7.0, `@types/node` 22→26. Los parches/menores (`react` 19.2.7→19.3.0, `tailwindcss`, `@tailwindcss/vite`, etc.) son seguros de subir.

### 2.5 Cobertura de testing
Solo existen 2 archivos e2e (`checkout.spec.ts`, `admin-features.spec.ts`), sin tests unitarios ni CI. **Sin ningún test:** login/logout y refresco de sesión; CRUD de productos (editar, archivar, restaurar, duplicar, historial); colorways/tallas y reordenamiento; filtros/búsqueda/paginación del catálogo y del panel; carrito y wishlist; pestaña Configuración; pestaña Testimonios (subida, reordenamiento); acciones confirmar/cancelar/revertir órdenes; exportes CSV; modo mantenimiento; funciones puras de `validation.ts` (candidatas ideales a unit tests); y **ninguna verificación de headers/CSP** (justo donde están los dos hallazgos importantes).

### 2.6 Accesibilidad y performance — revisión de código únicamente
**Esto NO reemplaza una medición real con Lighthouse/PageSpeed** (no se corrió nada).

**Importante — hallazgo nuevo**
- `App.tsx` mete retrasos artificiales: splash de **2,2 s** en cada carga y un skeleton "simulado" de **600 ms** cada vez que cambia un filtro. Perjudican LCP/percepción de velocidad de forma directa.

**Menor — hallazgo nuevo**
- Modales sin semántica de diálogo: 0 usos de `role="dialog"`/`aria-modal`; solo `ConfirmModal` y `ProductHistoryModal` cierran con Escape (checkout, carrito, filtros no).
- ~133 `<button>` contra 16 `aria-label` (varios botones solo con ícono dependen de `title` o no tienen nombre accesible).
- Contraste: 54 usos de `text-slate-300/400` y 105 de tamaños `text-[9-11px]` en componentes públicos; `slate-400` (#94a3b8) sobre blanco ronda 2,6:1, por debajo de 4,5:1 para texto chico.
- Bundle público de un solo chunk (~498 KB / 145 KB gzip); solo el panel admin está separado con `lazy`. `CatalogSection`/`ProductCard` (grandes) no están memoizados; `useMemo` casi solo en `App`/admin.
- Positivo: todas las `<img>` tienen `alt`, `<html lang="es">`, `loading="lazy"` en imágenes del catálogo.

---

## Prioridades (lo que yo haría primero)
1. **Arreglar el CSP en `netlify.toml`**: agregar `media-src` (videos de Testimonios) y `blob:` en `img-src` (optimizador de fotos). Impacto directo y de una línea; conviene sumarle un test que verifique que no hay violaciones de CSP.
2. **Hacer robusto el guardado de producto**: conservar el `productId` tras `createProduct` y no duplicar en reintentos; que el paso del costo sea no fatal y con `cost_price >= 0` validado.
3. **Quitar los retrasos artificiales (splash 2,2 s / skeleton 600 ms)** y medir de verdad con Lighthouse cuando el hosting vuelva.
4. **Endurecer la sesión**: refresh single-flight y llamada a `/auth/v1/logout` al cerrar sesión.
5. **Consolidar duplicados y cubrir lo básico**: helper único de subida/labels/CSV/precio, reemplazar `alert/confirm` por `ConfirmModal`, borrar `ColorwayManager.tsx`, y agregar tests de login + CRUD de productos + unit tests de `validation.ts`; correr `npm audit fix` cuando quieras.
