import { CartItem, CheckoutData } from "../types";
import { sbRest } from "./supabase";

// =========================================================================
// TIPOS
// =========================================================================
export type OrderStatus = "pendiente" | "confirmada" | "cancelada";

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  colorway: string | null;
  size: string | null;
  price_at_time: number;
  quantity: number;
}

export interface DbOrder {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  cedula: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  payment_method: string | null;
  total: number;
  confirmed_at: string | null;
  notes: string | null;
  order_items?: DbOrderItem[];
}

// =========================================================================
// CREAR SOLICITUD DESDE EL CHECKOUT (público, sin login)
// =========================================================================
// Se llama justo antes de abrir WhatsApp. Si por algún motivo falla (sin
// internet, Supabase caído, etc.) el checkout sigue igual: el registro
// interno es un plus para el dueño, no debe bloquear la venta real, que
// siempre se cierra por WhatsApp.
export async function createOrderFromCheckout(
  cartItems: CartItem[],
  data: CheckoutData,
  total: number
): Promise<void> {
  // Generamos el id en el navegador (en vez de dejar que Postgres lo asigne
  // con gen_random_uuid()) porque la escritura pide "return=minimal": ya no
  // recibimos la fila insertada de vuelta, así que necesitamos el id de
  // antemano para poder armar los order_items que dependen de él.
  const orderId = crypto.randomUUID();

  await sbRest("orders", {
    method: "POST",
    returnMinimal: true,
    body: {
      id: orderId,
      customer_name: data.fullName.trim(),
      cedula: data.cedula.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
      address: data.address.trim(),
      payment_method: data.paymentMethod,
      total,
      status: "pendiente",
      notes: data.observaciones?.trim() || null,
    },
  });

  const items = cartItems.map((item) => ({
    order_id: orderId,
    product_id: item.product.id,
    product_name: item.product.name,
    colorway: item.selectedColor,
    size: String(item.selectedSize),
    price_at_time: item.product.price,
    quantity: item.quantity,
  }));

  if (items.length > 0) {
    await sbRest("order_items", { method: "POST", returnMinimal: true, body: items });
  }
}

// =========================================================================
// PANEL DE ADMIN
// =========================================================================
export async function fetchOrders(): Promise<DbOrder[]> {
  return sbRest<DbOrder[]>("orders?select=*,order_items(*)&order=created_at.desc", {
    useAuth: true,
  });
}

export async function confirmOrder(id: string): Promise<void> {
  await sbRest(`orders?id=eq.${id}`, {
    method: "PATCH",
    useAuth: true,
    body: { status: "confirmada", confirmed_at: new Date().toISOString() },
  });
}

export async function cancelOrder(id: string): Promise<void> {
  await sbRest(`orders?id=eq.${id}`, {
    method: "PATCH",
    useAuth: true,
    body: { status: "cancelada" },
  });
}

// Por si el dueño se equivoca al confirmar/cancelar y quiere volver atrás.
export async function revertOrderToPending(id: string): Promise<void> {
  await sbRest(`orders?id=eq.${id}`, {
    method: "PATCH",
    useAuth: true,
    body: { status: "pendiente", confirmed_at: null },
  });
}
