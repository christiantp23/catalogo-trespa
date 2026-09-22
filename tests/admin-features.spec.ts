/**
 * Tests de las 3 features del panel admin agregadas recientemente:
 *   1. Costo de producto (product_costs) + métrica "Margen estimado (mes)".
 *   2. Comprobante de pago adjunto a la orden (orders.payment_proof_url).
 *   3. Historial de cliente recurrente ("Cliente recurrente — N compras...").
 *
 * Igual que tests/checkout.spec.ts: usan la base de datos REAL de Supabase
 * (no hay entorno de staging), se loguean como admin por API con las
 * credenciales de .env.test y limpian todo lo que crean en un bloque
 * "finally". Todo lo creado lleva el prefijo TEST_PREFIX para reconocerlo
 * a simple vista si alguna limpieza llegara a fallar.
 *
 * El panel se abre en http://localhost:4173/#admin (npm run build +
 * npm run preview, porque Netlify está pausado) con la sesión de admin
 * sembrada en localStorage — no se prueba el formulario de login acá.
 *
 *   npx playwright test tests/admin-features.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

const SITE_URL = 'http://localhost:4173';

const SUPABASE_URL = 'https://hdxcyvczbhmemjbdkjdh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeGN5dmN6YmhtZW1qYmRramRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjI3MjUsImV4cCI6MjEwNDg5ODcyNX0.e942f2xhSn400A_ZD93pD5AghTcoP6p-RiQsHK1Z0cs';

const TEST_PREFIX = 'TEST AUTOMATIZADO ADMIN';
const SESSION_STORAGE_KEY = 'trespa_admin_session';

// PNG de 1x1 píxel: alcanza para el uploader del comprobante.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

interface AdminSession {
  accessToken: string;
  refreshToken: string;
}

async function loginAsAdmin(): Promise<AdminSession> {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD en .env.test.');
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`No se pudo iniciar sesión como admin: ${data.error_description || data.msg || res.status}`);
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

function headers(session: AdminSession, extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function rest<T = unknown>(
  session: AdminSession,
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: headers(session, method === 'GET' ? {} : { Prefer: 'return=representation' }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Abre el panel admin con la sesión ya iniciada (tokens en localStorage,
// igual que los deja setSession en src/lib/supabase.ts).
async function openAdminPanel(page: Page, session: AdminSession) {
  await page.addInitScript(
    ([key, access, refresh]) => {
      localStorage.setItem(key, JSON.stringify({ access_token: access, refresh_token: refresh }));
    },
    [SESSION_STORAGE_KEY, session.accessToken, session.refreshToken]
  );
  await page.goto(`${SITE_URL}/#admin`);
  await page.getByRole('heading', { name: 'Panel Admin' }).waitFor({ state: 'visible' });
}

async function openSalesTab(page: Page) {
  await page.getByRole('button', { name: 'Ventas', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Ventas', exact: true }).waitFor({ state: 'visible' });
}

interface OrderSeed {
  customerName: string;
  status: 'pendiente' | 'confirmada';
  cedula?: string;
  phone?: string;
  createdAt?: string;
  items?: { productId: string | null; name: string; price: number; qty: number }[];
}

async function createOrder(session: AdminSession, seed: OrderSeed): Promise<string> {
  const now = new Date().toISOString();
  const items = seed.items ?? [];
  const [order] = await rest<{ id: string }[]>(session, 'orders', 'POST', {
    customer_name: seed.customerName,
    cedula: seed.cedula ?? null,
    phone: seed.phone ?? '3009998877',
    email: 'test.automatizado@example.com',
    city: 'Bogotá',
    address: 'Calle de prueba automatizada',
    payment_method: 'transferencia',
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    status: seed.status,
    confirmed_at: seed.status === 'confirmada' ? now : null,
    ...(seed.createdAt ? { created_at: seed.createdAt } : {}),
  });
  if (items.length > 0) {
    await rest(
      session,
      'order_items',
      'POST',
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.name,
        colorway: 'Test',
        size: '36',
        price_at_time: i.price,
        quantity: i.qty,
      }))
    );
  }
  return order.id;
}

async function deleteOrder(session: AdminSession, orderId: string) {
  await rest(session, `order_items?order_id=eq.${orderId}`, 'DELETE');
  await rest(session, `orders?id=eq.${orderId}`, 'DELETE');
}

async function deleteProductCascade(session: AdminSession, productId: string) {
  await rest(session, `order_items?product_id=eq.${productId}`, 'DELETE');
  await rest(session, `product_costs?product_id=eq.${productId}`, 'DELETE');
  const colorways = await rest<{ id: string }[]>(session, `colorways?select=id&product_id=eq.${productId}`);
  for (const c of colorways) {
    await rest(session, `sizes?colorway_id=eq.${c.id}`, 'DELETE');
  }
  await rest(session, `colorways?product_id=eq.${productId}`, 'DELETE');
  await rest(session, `product_history?product_id=eq.${productId}`, 'DELETE');
  await rest(session, `products?id=eq.${productId}`, 'DELETE');
}

// Lee el valor numérico (solo dígitos) de una card de métricas de Ventas.
async function readMetric(page: Page, label: string): Promise<number> {
  const valueLocator = page.locator(`p:has-text("${label}") + p`).first();
  await valueLocator.waitFor({ state: 'visible' });
  const text = await valueLocator.innerText();
  const negative = text.includes('-');
  const digits = Number(text.replace(/\D/g, ''));
  return negative ? -digits : digits;
}

// Misma fórmula que metrics.monthMargin en AdminOrders.tsx, calculada aparte
// contra los datos reales de Supabase (así el test no depende de que la base
// esté vacía de otras ventas confirmadas este mes).
async function expectedMonthMargin(session: AdminSession): Promise<number> {
  const orders = await rest<
    { status: string; confirmed_at: string | null; order_items: { product_id: string | null; price_at_time: number; quantity: number }[] }[]
  >(session, 'orders?select=status,confirmed_at,order_items(product_id,price_at_time,quantity)&status=eq.confirmada');
  const costs = await rest<{ product_id: string; cost_price: number | null }[]>(
    session,
    'product_costs?select=product_id,cost_price'
  );
  const costMap = new Map(costs.map((c) => [c.product_id, c.cost_price]));
  const now = new Date();
  let total = 0;
  for (const o of orders) {
    if (!o.confirmed_at) continue;
    const d = new Date(o.confirmed_at);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    for (const item of o.order_items ?? []) {
      if (!item.product_id) continue;
      const cost = costMap.get(item.product_id);
      if (cost === undefined || cost === null) continue;
      total += (item.price_at_time - cost) * item.quantity;
    }
  }
  return total;
}

// Filtra la lista de Ventas por nombre de cliente y elige el estado indicado
// para que la orden de prueba sea la única visible, luego expande su detalle.
async function showOrderDetail(page: Page, customerName: string, statusTab: 'Pendientes' | 'Confirmadas') {
  await page.getByRole('button', { name: new RegExp(`^${statusTab}`) }).click();
  await page.getByPlaceholder(/Buscar por nombre/).fill(customerName);
  const row = page.getByRole('button', { name: new RegExp(customerName) }).first();
  await row.waitFor({ state: 'visible' });
  await row.click();
}

test.describe.configure({ mode: 'serial' });

test('costo de producto: se guarda en product_costs, se precarga y alimenta el margen estimado', async ({ page }) => {
  const session = await loginAsAdmin();
  const productName = `${TEST_PREFIX} zapatilla costo`;
  const customerName = `${TEST_PREFIX} margen`;
  const COST = 120000;
  const PRICE = 200000;
  const QTY = 2;

  let productId: string | null = null;
  let orderId: string | null = null;

  try {
    await openAdminPanel(page, session);

    // --- Crear el producto por el formulario real, con costo cargado ---
    await page.getByRole('button', { name: /Nuevo producto/ }).click();
    await page.locator('input[name="name"]').fill(productName);
    await page.locator('input[name="brand"]').fill('TestBrand');
    // Si el catálogo no tiene categorías el formulario muestra el input de
    // categoría nueva directamente; si tiene, queda la primera preseleccionada.
    const customStyle = page.locator('input[name="style"]');
    if (await customStyle.count()) await customStyle.fill('TestStyle');
    await page.locator('input[name="price"]').fill(String(PRICE));
    await page.locator('input[name="costPrice"]').fill(String(COST));
    await page.getByPlaceholder('Nombre del color (ej: Azul/Vino)').last().fill('Test');
    await page.getByRole('button', { name: /Agregar$/ }).click();
    await page.locator('button[title="Agregar talla"]', { hasText: /^36$/ }).first().click();
    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page.getByText('¡Guardado!')).toBeVisible();

    // --- product_costs guardó la fila correcta ---
    const [product] = await rest<{ id: string }[]>(
      session,
      `products?select=id&name=eq.${encodeURIComponent(productName)}`
    );
    expect(product, 'el producto de prueba debería existir').toBeTruthy();
    productId = product.id;

    const costRows = await rest<{ product_id: string; cost_price: number }[]>(
      session,
      `product_costs?select=product_id,cost_price&product_id=eq.${productId}`
    );
    expect(costRows).toHaveLength(1);
    expect(Number(costRows[0].cost_price)).toBe(COST);

    // --- Al editar, el costo se precarga en el formulario ---
    await page.getByPlaceholder('Buscar por nombre o marca...').fill(productName);
    await page.locator('button[title="Editar"]').first().click();
    await expect(page.locator('input[name="costPrice"]')).toHaveValue(String(COST));
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // --- Orden confirmada con ese producto → la métrica de margen la refleja ---
    orderId = await createOrder(session, {
      customerName,
      status: 'confirmada',
      items: [{ productId, name: productName, price: PRICE, qty: QTY }],
    });

    await openSalesTab(page);
    const expected = await expectedMonthMargin(session);
    expect(expected).toBeGreaterThanOrEqual((PRICE - COST) * QTY);
    await expect.poll(() => readMetric(page, 'Margen estimado (mes)')).toBe(expected);
  } finally {
    if (orderId) await deleteOrder(session, orderId).catch((e) => console.error('limpieza orden:', e));
    if (productId) await deleteProductCascade(session, productId).catch((e) => console.error('limpieza producto:', e));
  }
});

test('comprobante de pago: se adjunta, queda en payment_proof_url y se muestra la miniatura', async ({ page }) => {
  const session = await loginAsAdmin();
  const customerName = `${TEST_PREFIX} comprobante`;
  let orderId: string | null = null;
  let proofUrl: string | null = null;

  try {
    orderId = await createOrder(session, { customerName, status: 'pendiente' });

    await openAdminPanel(page, session);
    await openSalesTab(page);
    await showOrderDetail(page, customerName, 'Pendientes');

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'comprobante-test.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });

    const thumbnail = page.locator('img[alt="Comprobante de pago"]');
    await expect(thumbnail).toBeVisible({ timeout: 30_000 });

    const [order] = await rest<{ payment_proof_url: string | null }[]>(
      session,
      `orders?select=payment_proof_url&id=eq.${orderId}`
    );
    proofUrl = order.payment_proof_url;
    expect(proofUrl, 'payment_proof_url debería quedar guardado').toBeTruthy();
    await expect(thumbnail).toHaveAttribute('src', proofUrl!);
    // La miniatura abre la imagen en una pestaña nueva.
    await expect(page.locator('a:has(img[alt="Comprobante de pago"])')).toHaveAttribute('target', '_blank');
  } finally {
    if (orderId) await deleteOrder(session, orderId).catch((e) => console.error('limpieza orden:', e));
    // Borra también el archivo subido al bucket para no dejar basura en Storage.
    if (proofUrl) {
      const objectPath = proofUrl.split('/object/public/')[1];
      if (objectPath) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${objectPath}`, {
          method: 'DELETE',
          // Sin Content-Type: Storage rechaza un DELETE con JSON y cuerpo vacío.
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` },
        }).catch(() => null);
        if (!res || !res.ok) console.warn(`No se pudo borrar el comprobante de prueba del bucket: ${objectPath}`);
      }
    }
  }
});

test('cliente recurrente: la segunda compra confirmada muestra el historial', async ({ page }) => {
  const session = await loginAsAdmin();
  const cedula = '99999998';
  const firstName = `${TEST_PREFIX} recurrente A`;
  const secondName = `${TEST_PREFIX} recurrente B`;
  const otherName = `${TEST_PREFIX} cliente nuevo`;
  const orderIds: string[] = [];

  try {
    orderIds.push(
      await createOrder(session, {
        customerName: firstName,
        status: 'confirmada',
        cedula,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      })
    );
    orderIds.push(await createOrder(session, { customerName: secondName, status: 'confirmada', cedula }));
    orderIds.push(
      await createOrder(session, { customerName: otherName, status: 'confirmada', cedula: '99999997', phone: '3001112233' })
    );

    await openAdminPanel(page, session);
    await openSalesTab(page);

    await showOrderDetail(page, secondName, 'Confirmadas');
    await expect(page.getByText('Cliente recurrente — 1 compra confirmada antes')).toBeVisible();

    // Un cliente con una sola compra confirmada no muestra el mensaje.
    await page.getByPlaceholder(/Buscar por nombre/).fill(otherName);
    await page.getByRole('button', { name: new RegExp(otherName) }).first().click();
    await expect(page.getByText('Cliente recurrente')).toHaveCount(0);
  } finally {
    for (const id of orderIds) {
      await deleteOrder(session, id).catch((e) => console.error('limpieza orden:', e));
    }
  }
});
