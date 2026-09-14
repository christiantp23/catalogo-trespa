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

  // Unimos todas las tallas de todos los colorways (la app actual no distingue
  // disponibilidad por combinación color+talla, solo por producto).
  const sizeSet = new Set<number>();
  colorways.forEach((c) =>
    (c.sizes ?? []).forEach((s) => {
      const n = parseInt(s.size, 10);
      if (!Number.isNaN(n)) sizeSet.add(n);
    })
  );
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
    "products?select=*,colorways(*,sizes(*))&archived=eq.false&order=created_at.desc"
  );
  return rows.map(mapDbProductToProduct);
}

// =========================================================================
// LECTURA + ESCRITURA PARA EL PANEL DE ADMIN
// =========================================================================
export async function fetchAdminProducts(opts: { includeArchived?: boolean } = {}): Promise<DbProduct[]> {
  const archivedFilter = opts.includeArchived ? "" : "&archived=eq.false";
  return sbRest<DbProduct[]>(
    `products?select=*,colorways(*,sizes(*))${archivedFilter}&order=created_at.desc`,
    { useAuth: true }
  );
}

export async function fetchArchivedProducts(): Promise<DbProduct[]> {
  return sbRest<DbProduct[]>(
    "products?select=*,colorways(*,sizes(*))&archived=eq.true&order=created_at.desc",
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
  imageUrl: string
): Promise<DbColorway> {
  const rows = await sbRest<DbColorway[]>("colorways", {
    method: "POST",
    useAuth: true,
    body: { product_id: productId, name, image_url: imageUrl || null, available: true },
  });
  return rows[0];
}

export async function updateColorway(
  id: string,
  input: Partial<{ name: string; image_url: string; available: boolean }>
): Promise<void> {
  await sbRest(`colorways?id=eq.${id}`, { method: "PATCH", useAuth: true, body: input });
}

export async function deleteColorway(id: string): Promise<void> {
  await sbRest(`colorways?id=eq.${id}`, { method: "DELETE", useAuth: true });
}

export async function addSize(colorwayId: string, size: string): Promise<void> {
  await sbRest("sizes", {
    method: "POST",
    useAuth: true,
    body: { colorway_id: colorwayId, size, available: true },
  });
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
