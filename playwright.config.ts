import { defineConfig, devices } from '@playwright/test';

// Carga .env.test (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD) con la API nativa
// de Node — no hace falta agregar la dependencia "dotenv" solo para esto.
try {
  process.loadEnvFile('.env.test');
} catch {
  // si el archivo no existe todavía, el test lo reporta con un mensaje claro
}

// Configuración mínima: un solo navegador (Chromium) y sin webServer local
// porque el único test que existe hoy (tests/checkout.spec.ts) pega contra
// el sitio EN VIVO a propósito, no contra localhost.
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
