import { Product } from "../types";
import { sbRest } from "./supabase";

// =========================================================================
// TIPOS QUE VIENEN DE SUPABASE (forma cruda de la base de datos)
// =========================================================================
export type DbStatus = "disponible" | "agotado" | "proximamente";
export type DbCategory = "hombre" | "mujer" | "unisex";

export interface DbSize {
  id: string;
  colorway_id: string;
  size: string;
  available: boolean;
}

export interface DbColorway {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  available: boolean;
  sort_order?: number;
  sizes?: DbSize[];
}

export interface DbProduct {
  id: string;
  name: string;
  category: DbCategory;
  style: string | null;
  gender: string | null; // 'Dama' | 'Caballero' | 'Unisex' tal cual lo usa la UI
  brand: string | null;
  description: string | null;
  images: string[];
  price: number | null;
  original_price: number | null;
  rating: number | null;
  is_new: boolean;
  is_hot: boolean;
  status: DbStatus;
  archived: boolean;
  colorways?: DbColorway[];
}

// =========================================================================
// MAPEO: fila de Supabase -> interfaz Product que ya usa toda la app
// =========================================================================
function mapDbProductToProduct(p: DbProduct): Product {
  const colorways = p.colorways ?? [];
  const colors = colorways.length ? colorways.map((c) => c.name) : ["Único"];

  const colorImages: Record<string, string> = {};
  colorways.forEach((c) => {
    if (c.image_url) colorImages[c.name] = c.image_url;
  });

  // "sizes" sigue siendo la unión de todas las tallas del producto (se usa en
  // resúmenes generales, ej. el lightbox). "sizesByColor" en cambio respeta
  // la disponibilidad real de cada talla dentro de CADA color, para que la
  // ficha del producto pueda bloquear una talla agotada en vez de mostrarla
  // como seleccionable solo porque otro color sí la tiene.
  const sizeSet = new Set<number>();
  const sizesByColor: Record<string, { size: number; available: boolean }[]> = {};
  colorways.forEach((c) => {
    const colorSizes = (c.sizes ?? [])
      .map((s) => {
        const n = parseInt(s.size, 10);
        return Number.isNaN(n) ? null : { size: n, available: s.available };
      })
      .filter((s): s is { size: number; available: boolean } => s !== null)
      .sort((a, b) => a.size - b.size);
    sizesByColor[c.name] = colorSizes;
    colorSizes.forEach((s) => sizeSet.add(s.size));
  });
  const sizes = Array.from(sizeSet).sort((a, b) => a - b);

  const mainImage = colorways[0]?.image_url || p.images?.[0] || "";

  return {
    id: p.id,
    name: p.name,
    brand: p.brand || "",
    price: p.price ?? 0,
    originalPrice: p.original_price ?? undefined,
    rating: p.rating ?? 4.8,
    image: mainImage,
    images: p.images?.length ? p.images : mainImage ? [mainImage] : [],
    category: p.style || "Urbano",
    description: p.description || "",
    colors,
    sizes,
    sizesByColor,
    isNew: p.is_new,
    isHot: p.is_hot,
    gender: (p.gender as Product["gender"]) || "Unisex",
    colorImages,
    isOutOfStock: p.status === "agotado",
  };
}

// =========================================================================
// LECTURA PÚBLICA (usada por la tienda)
// =========================================================================
export async function fetchProducts(): Promise<Product[]> {
  const rows = await sbRest<DbProduct[]>(
    "products?select=*,colorways(*,sizes(*))&archived=eq.false&order=created_at.desc&colorways.order=sort_order.asc"
  );
  return rows.map(mapDbProductToProduct);
}

// =========================================================================
// LECTURA + ESCRITURA PARA EL PANEL DE ADMIN
// =========================================================================
export async function fetchAdminProducts(opts: { includeArchived?: boolean } = {}): Promise<DbProduct[]> {
  const archivedFilter = opts.includeArchived ? "" : "&archived=eq.false";
  return sbRest<DbProduct[]>(
    `products?select=*,colorways(*,sizes(*))${archivedFilter}&order=created_at.desc&colorways.order=sort_order.asc`,
    { useAuth: true }
  );
}

export async function fetchArchivedProducts(): Promise<DbProduct[]> {
  return sbRest<DbProduct[]>(
    "products?select=*,colorways(*,sizes(*))&archived=eq.true&order=created_at.desc&colorways.order=sort_order.asc",
    { useAuth: true }
  );
}

export interface ProductInput {
  name: string;
  category: DbCategory;
  style: string;
  gender: string;
  brand: string;
  description: string;
  images: string[];
  price: number;
  original_price: number | null;
  rating: number;
  is_new: boolean;
  is_hot: boolean;
  status: DbStatus;
  archived?: boolean;
}

export async function createProduct(input: ProductInput): Promise<DbProduct> {
  const rows = await sbRest<DbProduct[]>("products", {
    method: "POST",
    useAuth: true,
    body: input,
  });
  return rows[0];
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<void> {
  await sbRest(`products?id=eq.${id}`, {
    method: "PATCH",
    useAuth: true,
    body: input,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await sbRest(`products?id=eq.${id}`, { method: "DELETE", useAuth: true });
}

export async function addColorway(
  productId: string,
  name: string,
  imageUrl: string,
  sortOrder?: number
): Promise<DbColorway> {
  const rows = await sbRest<DbColorway[]>("colorways", {
    method: "POST",
    useAuth: true,
    body: {
      product_id: productId,
      name,
      image_url: imageUrl || null,
      available: true,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    },
  });
  return rows[0];
}

export async function updateColorway(
  id: string,
  input: Partial<{ name: string; image_url: string; available: boolean; sort_order: number }>
): Promise<void> {
  await sbRest(`colorways?id=eq.${id}`, { method: "PATCH", useAuth: true, body: input });
}

export async function deleteColorway(id: string): Promise<void> {
  await sbRest(`colorways?id=eq.${id}`, { method: "DELETE", useAuth: true });
}

export async function addSize(colorwayId: string, size: string, available: boolean = true): Promise<DbSize> {
  const rows = await sbRest<DbSize[]>("sizes", {
    method: "POST",
    useAuth: true,
    body: { colorway_id: colorwayId, size, available },
  });
  return rows[0];
}

export async function updateSize(id: string, available: boolean): Promise<void> {
  await sbRest(`sizes?id=eq.${id}`, { method: "PATCH", useAuth: true, body: { available } });
}

export async function deleteSize(id: string): Promise<void> {
  await sbRest(`sizes?id=eq.${id}`, { method: "DELETE", useAuth: true });
}

// =========================================================================
// ARCHIVAR / RESTAURAR (borrado seguro en vez de eliminar en duro)
// =========================================================================
export async function archiveProduct(id: string): Promise<void> {
  await updateProduct(id, { archived: true });
}

export async function restoreProduct(id: string): Promise<void> {
  await updateProduct(id, { archived: false });
}

export async function permanentlyDeleteProduct(id: string): Promise<void> {
  await deleteProduct(id);
}

// =========================================================================
// HISTORIAL DE CAMBIOS DE PRODUCTOS (tabla product_history)
// =========================================================================
export interface DbProductHistory {
  id: string;
  product_id: string;
  product_name: string;
  change_type: "created" | "updated" | "archived" | "restored";
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string | null;
}

export async function logProductChange(
  productId: string,
  productName: string,
  changeType: DbProductHistory["change_type"],
  fieldChanged: string | null,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  await sbRest("product_history", {
    method: "POST",
    useAuth: true,
    body: {
      product_id: productId,
      product_name: productName,
      change_type: changeType,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
    },
  });
}

export async function fetchProductHistory(productId: string): Promise<DbProductHistory[]> {
  return sbRest<DbProductHistory[]>(
    `product_history?product_id=eq.${productId}&order=changed_at.desc`,
    { useAuth: true }
  );
}

// =========================================================================
// DUPLICAR PRODUCTO (copia el producto + sus colorways + sus tallas)
// =========================================================================
export async function duplicateProduct(product: DbProduct): Promise<DbProduct> {
  const copy = await createProduct({
    name: `${product.name} (copia)`,
    category: product.category,
    style: product.style || "",
    gender: product.gender || "",
    brand: product.brand || "",
    description: product.description || "",
    images: product.images || [],
    price: product.price || 0,
    original_price: product.original_price,
    rating: product.rating || 4.8,
    is_new: product.is_new,
    is_hot: product.is_hot,
    status: product.status,
  });

  for (const cw of product.colorways || []) {
    const newColorway = await addColorway(copy.id, cw.name, cw.image_url || "");
    for (const s of cw.sizes || []) {
      await addSize(newColorway.id, s.size);
    }
  }

  return copy;
}
