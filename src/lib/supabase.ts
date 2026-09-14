// =========================================================================
// CLIENTE SUPABASE (helpers vía REST/fetch, sin dependencia nueva)
// =========================================================================
// No usamos el paquete @supabase/supabase-js para no agregar una dependencia
// nueva al proyecto. Hablamos directo con las APIs REST (PostgREST) y de
// autenticación (GoTrue) de Supabase usando fetch, igual que hace cualquier
// llamada a una API externa.

export const SUPABASE_URL = "https://hdxcyvczbhmemjbdkjdh.supabase.co";
// La "anon key" es segura de exponer en el frontend: la seguridad real la
// da la Row Level Security (RLS) configurada en las tablas, no esta llave.
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeGN5dmN6YmhtZW1qYmRramRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjI3MjUsImV4cCI6MjEwNDg5ODcyNX0.e942f2xhSn400A_ZD93pD5AghTcoP6p-RiQsHK1Z0cs";

const SESSION_STORAGE_KEY = "trespa_admin_session";

let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

// =========================================================================
// SESIÓN: los tokens de Supabase vencen a la hora (por seguridad). Si no se
// renuevan, cualquier acción de escritura (guardar, subir foto) empieza a
// fallar con un error de "row-level security" aunque el panel siga viéndose
// como logueado. Esta sección se encarga de renovarlos solos.
// =========================================================================
export function setSession(accessToken: string, refreshToken: string) {
  currentAccessToken = accessToken;
  currentRefreshToken = refreshToken;
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
  );
}

export function clearSession() {
  currentAccessToken = null;
  currentRefreshToken = null;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function loadStoredSession(): boolean {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return false;
    const { access_token, refresh_token } = JSON.parse(saved);
    if (!access_token || !refresh_token) return false;
    currentAccessToken = access_token;
    currentRefreshToken = refresh_token;
    return true;
  } catch {
    return false;
  }
}

export function hasSession() {
  return !!currentAccessToken;
}

async function refreshSession(): Promise<boolean> {
  if (!currentRefreshToken) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setSession(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Mantenido por compatibilidad con el resto del código (login manual, etc.)
export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken() {
  return currentAccessToken;
}

interface RestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  useAuth?: boolean;
}

export async function sbRest<T = unknown>(
  path: string,
  { method = "GET", body, useAuth = false }: RestOptions = {},
  _isRetry = false
): Promise<T> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    Authorization: `Bearer ${useAuth && currentAccessToken ? currentAccessToken : SUPABASE_ANON_KEY}`,
  };
  if (method !== "GET") headers["Prefer"] = "return=representation";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Si la escritura falla por sesión vencida, intentamos renovar el token
  // UNA vez y reintentar la misma operación antes de mostrar error.
  if (!res.ok && useAuth && !_isRetry && (res.status === 401 || res.status === 403)) {
    const refreshed = await refreshSession();
    if (refreshed) return sbRest<T>(path, { method, body, useAuth }, true);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export async function sbLogin(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "No se pudo iniciar sesión");
  }
  return data as { access_token: string; refresh_token: string };
}

// =========================================================================
// SUBIDA DE IMÁGENES (Supabase Storage, bucket "product-images")
// =========================================================================
// Sube un archivo (foto sacada de celular, tablet o PC) y devuelve la URL
// pública ya lista para guardar en la base de datos. No requiere pasar por
// ningún servicio externo: el archivo va directo del navegador a Supabase.
export async function uploadProductImage(file: File, _isRetry = false): Promise<string> {
  const safeName = file.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/[^a-z0-9.]+/g, "-");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/product-images/${path}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${currentAccessToken || SUPABASE_ANON_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    }
  );

  // Mismo mecanismo de renovación automática de sesión que sbRest.
  if (!res.ok && !_isRetry && (res.status === 401 || res.status === 403)) {
    const refreshed = await refreshSession();
    if (refreshed) return uploadProductImage(file, true);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `No se pudo subir la imagen (${res.status})`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}
