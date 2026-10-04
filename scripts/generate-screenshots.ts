/**
 * Genera screenshots de la tienda pública y del panel admin en `screenshots/`
 * (PNG + metadata.json). Requiere el sitio corriendo en SCREENSHOT_BASE_URL
 * (por defecto http://localhost:4173, el puerto de `npm run preview`):
 *
 *   npm run build && npm run preview     # en otra terminal
 *   npm run screenshots
 *
 * Credenciales del panel admin: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD en
 * .env.test (las mismas que usan los tests e2e). Sin ellas se toma solo el
 * screenshot del login y se omiten las pestañas del admin.
 *
 * Privacidad: en la pestaña Ventas los nombres de clientes se tapan con una
 * máscara antes de sacar la captura (son datos personales reales).
 * El checkout se rellena con datos de ejemplo y NUNCA se envía.
 */

import { chromium, devices, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile('.env.test');
} catch {
  // sin .env.test: se omiten las pestañas del admin (ver más abajo)
}

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:4173';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');

const DESKTOP = { width: 1280, height: 720 };
const BUFFER_MS = 500;

const tienda: string[] = [];
const admin: string[] = [];
const errors: { file: string; error: string }[] = [];

// Cada captura corre aislada: si una falla se registra el error y se sigue.
async function shot(group: string[], file: string, action: () => Promise<void>) {
  try {
    await action();
    group.push(file);
    console.log(`  ✔ ${file}`);
  } catch (err) {
    const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
    errors.push({ file, error: message });
    console.error(`  ✘ ${file} — ${message}`);
  }
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(BUFFER_MS);
}

// Recorre la página de arriba abajo para que carguen las imágenes lazy y
// vuelve al inicio (así la captura fullPage no muestra huecos).
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 400);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await settle(page);
}

async function newContext(browser: Browser, mobile: boolean): Promise<BrowserContext> {
  const context = await browser.newContext(
    mobile
      ? { ...devices['iPhone 12'] } // 390x844
      : { viewport: DESKTOP, deviceScaleFactor: 1 }
  );
  // El splash ya se muestra una vez por sesión (sessionStorage): lo saltamos
  // para que las capturas sean deterministas.
  await context.addInitScript(() => sessionStorage.setItem('splash_shown', 'true'));
  return context;
}

async function openStore(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto(BASE_URL);
  await page.locator('#catalog-section').waitFor({ state: 'attached' });
  await settle(page);
  return page;
}

// Primer producto con botón habilitado; devuelve su botón "Solicitar Pedido".
async function firstAddButton(page: Page) {
  const button = page.locator('[id^="add-to-cart-btn-"]:not([disabled])').first();
  await button.waitFor({ state: 'visible' });
  await button.scrollIntoViewIfNeeded();
  return button;
}

// Captura la tarjeta del primer producto completa (con margen), aunque sea más
// alta que el viewport — así la foto y las opciones salen enteras.
async function shotProductCard(page: Page, file: string) {
  const card = page.locator('[id^="product-card-"]').first();
  await card.scrollIntoViewIfNeeded();
  await settle(page);
  const box = await card.boundingBox();
  if (!box) throw new Error('no se encontró la tarjeta de producto');
  const scrollY = await page.evaluate(() => window.scrollY);
  const pad = 24;
  // El navbar (sticky) y los botones flotantes (fixed) se dibujarían encima de la
  // tarjeta: los ocultamos solo durante este recorte.
  await page.addStyleTag({ content: '[data-shot-hide] { visibility: hidden !important; }' });
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const position = getComputedStyle(el).position;
      if (position === 'fixed' || position === 'sticky') el.setAttribute('data-shot-hide', '');
    });
  });
  try {
    await page.screenshot({
      path: join(OUT_DIR, file),
      fullPage: true,
      clip: {
        x: Math.max(box.x - pad, 0),
        y: Math.max(box.y + scrollY - pad, 0),
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      },
    });
  } finally {
    await page.evaluate(() => document.querySelectorAll('[data-shot-hide]').forEach((el) => el.removeAttribute('data-shot-hide')));
  }
}

async function storeShots(browser: Browser) {
  console.log('\nTienda pública (desktop)');
  const context = await newContext(browser, false);
  const page = await openStore(context);

  await shot(tienda, '01-hero-catalogo.png', async () => {
    await scrollThrough(page);
    await page.screenshot({ path: join(OUT_DIR, '01-hero-catalogo.png'), fullPage: true });
  });

  await shot(tienda, '02-catalogo-desktop.png', async () => {
    await page.locator('[id^="product-card-"]').first().waitFor({ state: 'visible' });
    await page.evaluate(() => {
      const card = document.querySelector('[id^="product-card-"]');
      if (card) window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 110);
    });
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, '02-catalogo-desktop.png') });
  });

  // En desktop el panel de filtros es fijo (inline); el drawer inferior es solo mobile.
  await shot(tienda, '03-filtros-desktop.png', async () => {
    const panel = page.getByRole('heading', { name: 'Filtros del Catálogo' });
    await panel.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -80));
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, '03-filtros-desktop.png') });
  });

  await shot(tienda, '04-ficha-producto.png', async () => {
    const button = await firstAddButton(page);
    await button.click(); // primer clic: abre color/talla
    await shotProductCard(page, '04-ficha-producto.png');
  });

  await shot(tienda, '05-carrito.png', async () => {
    await page.locator('[id^="add-to-cart-btn-"]:not([disabled])').first().click(); // confirma talla
    await page.locator('#cart-trigger-btn').click();
    await page.locator('#cart-sidebar').waitFor({ state: 'visible' });
    // El toast "¡Agregado al carrito!" tapa el botón de checkout: esperamos a que se vaya.
    await page.getByText('¡Agregado al carrito!').waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, '05-carrito.png') });
  });

  await shot(tienda, '06-checkout.png', async () => {
    await page.locator('#checkout-trigger-btn').click();
    await page.locator('#checkout-modal').waitFor({ state: 'visible' });
    await fillCheckoutExample(page);
    // Viewport más alto solo para esta captura: que entren método de pago y total.
    await page.setViewportSize({ width: DESKTOP.width, height: 1100 });
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, '06-checkout.png') });
  });

  await context.close();
}

async function fillCheckoutExample(page: Page) {
  await page.fill('input[name="fullName"]', 'Cliente de Ejemplo');
  await page.fill('input[name="email"]', 'ejemplo@correo.com');
  await page.fill('input[name="cedula"]', '1000000000');
  await page.fill('input[name="phone"]', '3001234567');
  await page.fill('input[name="city"]', 'Cali');
  await page.fill('input[name="address"]', 'Calle 10 # 20-30, apto 101');
}

async function mobileShots(browser: Browser) {
  console.log('\nTienda pública (mobile 390x844)');
  const context = await newContext(browser, true);
  const page = await openStore(context);

  await shot(tienda, '07-mobile-hero-catalogo.png', async () => {
    await scrollThrough(page);
    await page.screenshot({ path: join(OUT_DIR, '07-mobile-hero-catalogo.png'), fullPage: true });
  });

  await shot(tienda, '08-mobile-ficha-producto.png', async () => {
    const button = await firstAddButton(page);
    await button.click();
    await shotProductCard(page, '08-mobile-ficha-producto.png');
  });

  await shot(tienda, '09-mobile-checkout.png', async () => {
    await page.locator('[id^="add-to-cart-btn-"]:not([disabled])').first().click();
    await page.locator('#cart-trigger-btn').click();
    await page.locator('#checkout-trigger-btn').click();
    await page.locator('#checkout-modal').waitFor({ state: 'visible' });
    await fillCheckoutExample(page);
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, '09-mobile-checkout.png') });
  });

  await context.close();
}

async function adminShots(browser: Browser) {
  console.log('\nPanel admin (desktop)');
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  const context = await newContext(browser, false);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/#admin`);
  await page.locator('input[type="email"]').waitFor({ state: 'visible' });
  await settle(page);

  await shot(admin, '10-admin-login.png', async () => {
    await page.screenshot({ path: join(OUT_DIR, '10-admin-login.png') });
  });

  if (!email || !password) {
    console.warn('  ! Faltan TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD en .env.test — se omiten las pestañas del admin.');
    await context.close();
    return;
  }

  try {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('form button[type="submit"]').click();
    await page.getByRole('heading', { name: 'Panel Admin' }).waitFor({ state: 'visible', timeout: 15_000 });
  } catch {
    errors.push({ file: '(login admin)', error: 'No se pudo iniciar sesión — revisá las credenciales de .env.test' });
    console.error('  ✘ No se pudo iniciar sesión en el admin — se omiten las pestañas.');
    await context.close();
    return;
  }

  const openTab = async (name: string) => {
    await page.getByRole('button', { name, exact: true }).first().click();
    await settle(page);
  };

  await shot(admin, '11-admin-productos.png', async () => {
    await openTab('Productos');
    await page.getByPlaceholder('Buscar por nombre o marca...').waitFor({ state: 'visible' });
    await page.screenshot({ path: join(OUT_DIR, '11-admin-productos.png') });
  });

  await shot(admin, '12-admin-ventas.png', async () => {
    await openTab('Ventas');
    await page.getByText('Sincronizado').first().waitFor({ state: 'visible' });
    // Nombres de clientes reales: se tapan en la captura.
    const customerNames = page.locator('button p.font-semibold.truncate');
    await page.screenshot({
      path: join(OUT_DIR, '12-admin-ventas.png'),
      mask: [customerNames],
      maskColor: '#94a3b8',
    });
  });

  await shot(admin, '13-admin-configuracion.png', async () => {
    await openTab('Configuración');
    await page.getByRole('heading', { name: 'Configuración del sitio' }).waitFor({ state: 'visible' });
    await page.screenshot({ path: join(OUT_DIR, '13-admin-configuracion.png'), fullPage: true });
  });

  await shot(admin, '14-admin-testimonios.png', async () => {
    await openTab('Testimonios');
    await page.getByRole('heading', { name: 'Testimonios', exact: true }).waitFor({ state: 'visible' });
    await page.screenshot({ path: join(OUT_DIR, '14-admin-testimonios.png'), fullPage: true });
  });

  await context.close();
}

async function assertSiteIsUp() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    console.error(
      `No hay un sitio respondiendo en ${BASE_URL}.\n` +
        'Levantalo antes (npm run build && npm run preview) o definí SCREENSHOT_BASE_URL.'
    );
    process.exit(1);
  }
}

async function main() {
  await assertSiteIsUp();
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    await storeShots(browser);
    await mobileShots(browser);
    await adminShots(browser);
  } finally {
    await browser.close();
  }

  const total = tienda.length + admin.length;
  writeFileSync(
    join(OUT_DIR, 'metadata.json'),
    JSON.stringify(
      { timestamp: new Date().toISOString(), baseUrl: BASE_URL, totalScreenshots: total, tienda, admin, errors },
      null,
      2
    )
  );

  console.log(`\n${total} screenshots guardados en ${OUT_DIR}`);
  if (errors.length) {
    console.log(`${errors.length} fallaron:`);
    errors.forEach((e) => console.log(`  - ${e.file}: ${e.error}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
