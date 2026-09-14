export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number; // in COP (Colombian Pesos) or standard currency notation
  originalPrice?: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  colors: string[];
  sizes: number[]; // unión de todas las tallas del producto (para resúmenes generales, ej. el lightbox)
  // Tallas por color con su disponibilidad real (viene de sizes.available en Supabase).
  // Permite que la ficha del producto muestre solo las tallas de ese color y bloquee
  // las agotadas en vez de mezclarlas todas en un único array como antes.
  sizesByColor?: Record<string, { size: number; available: boolean }[]>;
  isNew?: boolean;
  isHot?: boolean;
  gender?: 'Dama' | 'Caballero' | 'Unisex';
  images?: string[];
  colorImages?: Record<string, string>;
  isOutOfStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: number;
  selectedColor: string;
  selectedColorImage?: string;
}

export interface CheckoutData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  cedula: string;
  observaciones?: string;
  paymentMethod: 'bold_tarjeta' | 'transferencia';
}

// Interfaz para el sistema de notificaciones flotantes (Toast)
export interface ToastNotification {
  id: string;
  message: string;
  type: 'cart' | 'favorite_add' | 'favorite_remove';
  productName: string;
}