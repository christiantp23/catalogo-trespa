import { sbRest } from "./supabase";

// =========================================================================
// PRECIO DE COSTO POR PRODUCTO (tabla product_costs, solo admin)
// =========================================================================
// Tabla separada de `products` a propósito: el fetch público de la tienda
// usa `products?select=*`, y el costo nunca debe poder viajar por ahí. RLS
// en product_costs exige is_admin() para todo (sin policy de lectura
// pública), así que estas funciones siempre usan useAuth:true.
interface DbProductCost {
  product_id: string;
  cost_price: number | null;
}

export async function fetchProductCosts(): Promise<Map<string, number | null>> {
  const rows = await sbRest<DbProductCost[]>("product_costs?select=product_id,cost_price", {
    useAuth: true,
  });
  return new Map(rows.map((r) => [r.product_id, r.cost_price]));
}

// sbRest no soporta el header "Prefer: resolution=merge-duplicates" que
// necesitaría un upsert nativo de PostgREST (on_conflict), así que resolvemos
// con dos pasos: primero miramos si ya existe la fila, después PATCH o POST.
export async function upsertProductCost(productId: string, costPrice: number | null): Promise<void> {
  const existing = await sbRest<{ product_id: string }[]>(
    `product_costs?select=product_id&product_id=eq.${productId}`,
    { useAuth: true }
  );

  if (existing.length > 0) {
    await sbRest(`product_costs?product_id=eq.${productId}`, {
      method: "PATCH",
      useAuth: true,
      body: { cost_price: costPrice },
    });
  } else {
    await sbRest("product_costs", {
      method: "POST",
      useAuth: true,
      body: { product_id: productId, cost_price: costPrice },
    });
  }
}
