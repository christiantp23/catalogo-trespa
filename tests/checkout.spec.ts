/**
 * ⚠️ ESTE TEST PEGA CONTRA EL SITIO EN VIVO (https://trespastore.netlify.app),
 * NO contra localhost — a propósito, para probar exactamente lo que usan los
 * clientes reales.
 *
 * Requiere el archivo .env.test en la raíz del proyecto con credenciales
 * REALES de un usuario admin ya existente:
 *
 *   TEST_ADMIN_EMAIL=tu-email-de-admin@ejemplo.com
 *   TEST_ADMIN_PASSWORD=tu-contraseña-de-admin
 *
 * Esas credenciales son necesarias porque la política de lectura (SELECT)
 * de "orders" en Supabase exige is_admin() — sin loguearse como admin no hay
 * forma de confirmar por API que la orden realmente se guardó.
 *
 * Este test hace una compra de prueba real (queda registrada en la tabla
 * "orders" con el nombre "TEST AUTOMATIZADO - no confirmar") y la borra al
 * final como limpieza, para no dejar basura en el panel de Ventas.
 *
 * Todavía NO corre en ningún pipeline de CI — este proyecto no tiene CI
 * configurado. Se corre a mano con:
 *
 *   npm run test:e2e
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

// TEMPORAL: apunta a local porque Netlify está pausado hasta el 11 de
// octubre por los créditos del plan gratuito. Volver a la URL de producción
// (https://trespastore.netlify.app) apenas el sitio esté reactivado.
const SITE_URL = 'http://localhost:4173';

// Mismos valores públicos que usa src/lib/supabase.ts (la anon key es segura
// de exponer: la seguridad real la da la Row Level Security de Supabase).
const SUPABASE_URL = 'https://hdxcyvczbhmemjbdkjdh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeGN5dmN6YmhtZW1qYmRramRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjI3MjUsImV4cCI6MjEwNDg5ODcyNX0.e942f2xhSn400A_ZD93pD5AghTcoP6p-RiQsHK1Z0cs';

// Nombre de cliente reconocible a propósito, para no confundirlo jamás con
// una venta real si algo falla en la limpieza automática.
const TEST_CUSTOMER_NAME = 'TEST AUTOMATIZADO - no confirmar';
// Celular colombiano válido según validateColombianMobile (src/lib/validation.ts):
// empieza en 3, exactamente 10 dígitos.
const TEST_PHONE = '3009998877';

// Agrega el primer producto disponible (no agotado, con alguna talla libre)
// al carrito. El botón "Solicitar Pedido" es de dos clics: el primero abre
// el selector de color/talla, el segundo confirma con la talla ya elegida
// por defecto (la primera disponible).
async function addFirstAvailableProductToCart(page: Page): Promise<void> {
  const candidates = page.locator('[id^="add-to-cart-btn-"]:not([disabled])');
  await candidates.first().waitFor({ state: 'visible' });

  const count = await candidates.count();
  for (let i = 0; i < count; i++) {
    const button: Locator = candidates.nth(i);
    await button.scrollIntoViewIfNeeded();
    await button.click(); // abre color/talla
    if (await button.isDisabled().catch(() => false)) {
      // este color por defecto no tiene tallas disponibles; probamos el siguiente producto
      continue;
    }
    await button.click(); // confirma con la talla ya seleccionada
    return;
  }
  throw new Error('No se encontró ningún producto con una talla disponible para agregar al carrito.');
}

async function loginAsAdmin(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `No se pudo iniciar sesión como admin para verificar la orden (revisa TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD en .env.test): ${
        data.error_description || data.msg || res.status
      }`
    );
  }
  return data.access_token as string;
}

async function findTestOrder(accessToken: string): Promise<{ id: string } | null> {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const url =
    `${SUPABASE_URL}/rest/v1/orders?customer_name=eq.${encodeURIComponent(TEST_CUSTOMER_NAME)}` +
    `&created_at=gte.${encodeURIComponent(twoMinutesAgo)}&order=created_at.desc&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`No se pudo consultar la tabla orders: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as { id: string }[];
  return rows[0] ?? null;
}

async function deleteTestOrder(accessToken: string, orderId: string): Promise<void> {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` };
  // Primero los order_items (sin borrado en cascada confirmado), después la orden.
  await fetch(`${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}`, {
    method: 'DELETE',
    headers,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: 'DELETE',
    headers,
  });
}

test('el checkout público guarda la orden en Supabase', async ({ page, context }) => {
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Faltan TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD en .env.test — completalos con credenciales reales de admin antes de correr este test.'
    );
  }

  let accessToken: string | null = null;
  let createdOrderId: string | null = null;

  try {
    await page.goto(SITE_URL);

    await addFirstAvailableProductToCart(page);

    // Abrir el carrito y pasar al checkout.
    await page.locator('#cart-trigger-btn').click();
    await page.locator('#checkout-trigger-btn').click();
    await page.locator('#checkout-modal').waitFor({ state: 'visible' });

    // Completar el formulario con datos de prueba reconocibles.
    await page.fill('input[name="fullName"]', TEST_CUSTOMER_NAME);
    await page.fill('input[name="email"]', 'test.automatizado@example.com');
    await page.fill('input[name="cedula"]', '99999999');
    await page.fill('input[name="phone"]', TEST_PHONE);
    await page.fill('input[name="city"]', 'Bogotá');
    await page.fill('input[name="address"]', 'Calle 1 # 2-34, apto de prueba automatizada');

    // Enviar el formulario: confirma que se abre una pestaña nueva hacia
    // WhatsApp (no hace falta completar nada ahí).
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 20_000 }),
      page.locator('#checkout-modal form button[type="submit"]').click(),
    ]);

    // Justo acá, apenas se envió el checkout, la orden YA existe en Supabase
    // (es efecto del sitio real). Logueamos y la buscamos de inmediato para
    // capturar su ID lo antes posible: si alguna verificación de más abajo
    // falla (por ejemplo la de la URL de WhatsApp), el bloque "finally"
    // todavía puede borrarla y no queda huérfana en el panel de Ventas.
    accessToken = await loginAsAdmin(adminEmail, adminPassword);
    const order = await findTestOrder(accessToken);
    createdOrderId = order?.id ?? null;

    expect(popup.url()).toMatch(/wa\.me|whatsapp\.com/);
    await popup.close();

    expect(order, 'La orden de prueba debería existir en Supabase después del checkout').not.toBeNull();
  } finally {
    // Limpieza: nunca dejar la orden de prueba colgada en el panel de Ventas real.
    if (accessToken && createdOrderId) {
      await deleteTestOrder(accessToken, createdOrderId);
    }
  }
});
