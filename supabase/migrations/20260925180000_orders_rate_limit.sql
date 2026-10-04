-- =========================================================================
-- Rate limiting de órdenes — Trespa Store (aplicada en Supabase el 2026-09-25)
-- =========================================================================
-- Contexto: la anon key va en el bundle del cliente (a propósito), y las
-- políticas de INSERT de `orders` eran `WITH CHECK (true)`: cualquiera podía
-- crear órdenes ilimitadas, incluso con status 'confirmada' y precios
-- inventados, inflando las métricas del panel (Ventas / margen estimado).
--
-- Este archivo es la versión CONSOLIDADA del estado final. En Supabase se
-- aplicó en dos migraciones (`orders_insert_policy_and_rate_limit` y
-- `orders_insert_policy_split_admin`): la primera llamaba is_admin() dentro de
-- la política pública y rompía el checkout, porque el rol anon no puede
-- ejecutar is_admin(); la segunda lo corrigió. Este archivo ya incluye la
-- corrección. Es re-ejecutable (drop if exists / create or replace).
--
-- Requiere que ya existan: tabla public.orders (con payment_proof_url),
-- public.is_admin() y public.admin_users.
--
-- Comportamiento:
--   * Público (anon): solo puede insertar órdenes 'pendiente', sin
--     confirmed_at ni payment_proof_url.
--   * Admin (authenticated + is_admin()): puede insertar órdenes de cualquier
--     estado y no le aplica el límite (lo usan el panel y tests/admin-features.spec.ts).
--   * Trigger: rechaza con HTTP 429 (SQLSTATE PT429) si el mismo teléfono
--     (últimos 10 dígitos) ya tiene 3 órdenes en la última hora, o si hay 30
--     órdenes en total en la última hora.
--   * Límite conocido: el tope global de 30/h puede llenarse a propósito con
--     teléfonos distintos y bloquear el registro de pedidos reales esa hora
--     (el checkout igual abre WhatsApp aunque el registro falle).
--
-- Verificado el 2026-09-25 contra la API real: orden válida 201; confirmada /
-- cancelada / con confirmed_at / con payment_proof_url → rechazadas por RLS;
-- 4ª orden del mismo teléfono → 429 (también con otro formato del número);
-- orden 31 de la hora → 429.

-- ---------------------------------------------------------------------------
-- 1) Política pública: estricta y SIN is_admin() (anon no puede ejecutarla;
--    una política que la llame rompe todos los inserts de anon).
-- ---------------------------------------------------------------------------
drop policy if exists orders_insert_public on public.orders;
create policy orders_insert_public on public.orders
  for insert
  to public
  with check (
    status = 'pendiente'
    and confirmed_at is null
    and payment_proof_url is null
  );

-- ---------------------------------------------------------------------------
-- 2) Política del admin: solo para usuarios autenticados (anon nunca la evalúa).
-- ---------------------------------------------------------------------------
drop policy if exists orders_insert_admin on public.orders;
create policy orders_insert_admin on public.orders
  for insert
  to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3) Trigger anti-spam BEFORE INSERT.
--    SECURITY DEFINER porque anon no puede leer `orders` (RLS) y necesita
--    contar las filas recientes.
-- ---------------------------------------------------------------------------
create or replace function public.orders_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  phone_digits text;
  phone_count integer;
  total_count integer;
begin
  -- El dueño (admin) no está sujeto al límite.
  if public.is_admin() then
    return new;
  end if;

  -- Serializa los inserts para que el conteo sea exacto aun con requests simultáneos.
  perform pg_advisory_xact_lock(hashtext('orders_rate_limit'));

  -- Compara los últimos 10 dígitos: "300 111 0000" y "+57 3001110000" son el mismo teléfono.
  phone_digits := right(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 10);

  select count(*) into phone_count
  from public.orders
  where created_at > now() - interval '1 hour'
    and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = phone_digits;

  if phone_count >= 3 then
    raise exception 'Demasiados pedidos desde este teléfono. Intentá de nuevo más tarde.'
      using errcode = 'PT429';
  end if;

  select count(*) into total_count
  from public.orders
  where created_at > now() - interval '1 hour';

  if total_count >= 30 then
    raise exception 'Demasiados pedidos en la última hora. Intentá de nuevo más tarde.'
      using errcode = 'PT429';
  end if;

  return new;
end;
$$;

-- Función interna: nadie debe poder llamarla como RPC.
revoke all on function public.orders_rate_limit() from public, anon, authenticated;

drop trigger if exists trg_orders_rate_limit on public.orders;
create trigger trg_orders_rate_limit
  before insert on public.orders
  for each row execute function public.orders_rate_limit();

-- ---------------------------------------------------------------------------
-- ROLLBACK (volver al estado anterior: cualquiera puede insertar cualquier orden)
-- ---------------------------------------------------------------------------
-- drop trigger if exists trg_orders_rate_limit on public.orders;
-- drop function if exists public.orders_rate_limit();
-- drop policy if exists orders_insert_admin on public.orders;
-- drop policy if exists orders_insert_public on public.orders;
-- create policy orders_insert_public on public.orders for insert to public with check (true);
