import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { X, AlertCircle, Upload, Loader2, ImageOff, Plus, Trash2, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import {
  DbProduct,
  DbStatus,
  DbCategory,
  createProduct,
  updateProduct,
  addColorway,
  updateColorway,
  deleteColorway,
  addSize,
  updateSize,
  deleteSize,
  logProductChange,
} from '../../lib/products';
import { uploadProductImage, UploadPhase } from '../../lib/supabase';

const PHASE_LABEL: Record<UploadPhase, string> = {
  optimizing: 'Optimizando imagen...',
  uploading: 'Subiendo...',
};
import { validateRequiredText, validatePositivePrice } from '../../lib/validation';

interface ProductFormModalProps {
  product: DbProduct | null; // null = crear nuevo
  existingStyles: string[]; // categorías/estilos ya usados en el catálogo, para el select
  onClose: () => void;
  onSaved: () => void;
}

// Campos validados — mismo patrón de errors/touched que CheckoutModal.tsx:
// el error no se muestra hasta que el usuario toca el campo o intenta
// guardar. "colors" no es un <input> sino la sección de colores/tallas
// completa, validada solo al intentar guardar.
type ProductField = 'name' | 'brand' | 'style' | 'gender' | 'price' | 'originalPrice' | 'colors';

const GENDER_TO_CATEGORY: Record<string, DbCategory> = {
  Dama: 'mujer',
  Caballero: 'hombre',
  Unisex: 'unisex',
};

// ============================================================================
// GUÍA DE TALLAS TRESPA STORE (Colombia)
// Fuente de verdad para las tallas que se ofrecen al crear/editar un
// producto. Lo que se guarda en la base de datos es siempre el valor CO.
// ============================================================================
// Se ofrecen en EUR porque es la talla que llega del proveedor y la que ya
// muestra el sitio público al cliente ("Talla (EUR): ..."). El admin nunca
// tiene que convertir nada: elige directamente el número que viene en la caja.
const SIZE_GUIDE_CHIPS: Record<'Caballero' | 'Dama' | 'Unisex', string[]> = {
  Caballero: ['40', '41', '42', '43', '44'],
  Dama: ['36', '37', '38', '39'],
  Unisex: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
};

const SIZE_GUIDE_TABLE: Record<'Hombre' | 'Mujer', { co: string; us: string; eur: string; cm: string }[]> = {
  Hombre: [
    { co: '37', us: '7', eur: '40', cm: '25' },
    { co: '38', us: '8', eur: '41', cm: '26' },
    { co: '39/40', us: '8.5/9', eur: '42', cm: '26.5' },
    { co: '41', us: '9.5', eur: '43', cm: '27' },
    { co: '42', us: '10', eur: '44', cm: '28' },
  ],
  Mujer: [
    { co: '35', us: '5/5.5', eur: '36', cm: '22.5' },
    { co: '36', us: '6', eur: '37', cm: '23.5' },
    { co: '37', us: '6.5/7', eur: '38', cm: '24' },
    { co: '38', us: '7.5/8', eur: '39', cm: '25' },
  ],
};

const genKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

// ============================================================================
// Colores y tallas se editan en memoria (estado local) y recién se guardan
// en Supabase cuando se envía el formulario completo con "Crear producto"
// o "Guardar cambios".
// ============================================================================
interface LocalSize {
  key: string;
  id: string | null; // id real en Supabase si ya existía
  size: string;
  available: boolean;
  deleted?: boolean;
}

interface LocalColorway {
  key: string;
  id: string | null; // id real en Supabase si ya existía
  name: string;
  image_url: string;
  available: boolean;
  sizes: LocalSize[];
  deleted?: boolean;
}

function colorwaysFromProduct(product: DbProduct | null): LocalColorway[] {
  if (!product?.colorways) return [];
  return product.colorways.map((c) => ({
    key: c.id,
    id: c.id,
    name: c.name,
    image_url: c.image_url || '',
    available: c.available,
    sizes: (c.sizes || []).map((s) => ({
      key: s.id,
      id: s.id,
      size: s.size,
      available: s.available,
    })),
  }));
}

export default function ProductFormModal({ product, existingStyles, onClose, onSaved }: ProductFormModalProps) {
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [gender, setGender] = useState(product?.gender || 'Dama');
  // La categoría ("Estilo") se elige de las que ya existen en el catálogo.
  // "Otra" abre un campo de texto; esa categoría nueva queda disponible en
  // el select para la próxima vez apenas se guarda este producto (porque el
  // listado de categorías se recalcula solo a partir de los productos, sin
  // necesidad de guardarla en ningún otro lado).
  const OTHER_STYLE = '__otra__';
  const initialStyle = product?.style || existingStyles[0] || '';
  const [style, setStyle] = useState(initialStyle);
  const [showCustomStyle, setShowCustomStyle] = useState(
    () => existingStyles.length === 0 || (!!initialStyle && !existingStyles.includes(initialStyle))
  );
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase | null>(null);
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() || '');
  const [rating, setRating] = useState(product?.rating?.toString() || '4.8');
  const [isNew, setIsNew] = useState(product?.is_new ?? true);
  const [isHot, setIsHot] = useState(product?.is_hot ?? false);
  const [status, setStatus] = useState<DbStatus>(product?.status || 'disponible');

  const [colorways, setColorways] = useState<LocalColorway[]>(() => colorwaysFromProduct(product));
  const [newColorName, setNewColorName] = useState('');
  const [newColorImage, setNewColorImage] = useState('');
  const [uploadingNewColor, setUploadingNewColor] = useState(false);
  const [newColorUploadPhase, setNewColorUploadPhase] = useState<UploadPhase | null>(null);
  const [uploadingColorKey, setUploadingColorKey] = useState<string | null>(null);
  const [colorUploadPhase, setColorUploadPhase] = useState<UploadPhase | null>(null);
  const [customSizeByColor, setCustomSizeByColor] = useState<Record<string, string>>({});
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProductField, string>>>({});
  const [fieldTouched, setFieldTouched] = useState<Partial<Record<ProductField, boolean>>>({});

  const validateProductField = (field: ProductField): string => {
    switch (field) {
      case 'name':
        return validateRequiredText(name, 'El nombre del modelo', 3);
      case 'brand':
        return validateRequiredText(brand, 'La marca');
      case 'style':
        return validateRequiredText(style, 'La categoría');
      case 'gender':
        return validateRequiredText(gender, 'El género');
      case 'price':
        return validatePositivePrice(price);
      case 'originalPrice': {
        if (!originalPrice.trim()) return '';
        const orig = Number(originalPrice);
        if (Number.isNaN(orig)) return 'El precio anterior debe ser un número';
        if (orig <= 0) return 'El precio anterior debe ser mayor a 0';
        const curr = Number(price);
        if (!Number.isNaN(curr) && curr > 0 && orig <= curr) {
          return 'El precio anterior debe ser mayor al precio actual';
        }
        return '';
      }
      case 'colors': {
        const activeColorways = colorways.filter((c) => !c.deleted);
        if (activeColorways.length === 0) return 'Agregá al menos un color antes de guardar';
        const hasAnySize = activeColorways.some((c) => c.sizes.some((s) => !s.deleted));
        if (!hasAnySize) return 'Agregá al menos una talla en algún color antes de guardar';
        return '';
      }
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: ProductField) => {
    setFieldTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateProductField(field) }));
  };

  // Revalida en tiempo real los campos que el usuario ya tocó, cada vez que
  // cambia alguno de los valores de los que depende la validación. Se hace
  // en un efecto (en vez de dentro de cada onChange) porque el estado de
  // React se actualiza en el siguiente render: validar contra "price" o
  // "name" justo en el mismo onChange que los cambia leería el valor
  // todavía viejo. También cubre el caso cruzado de "originalPrice", cuyo
  // error depende de "price".
  useEffect(() => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      (['name', 'brand', 'style', 'gender', 'price', 'originalPrice'] as ProductField[]).forEach((field) => {
        if (fieldTouched[field]) {
          const msg = validateProductField(field);
          if (next[field] !== msg) {
            next[field] = msg;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, brand, style, gender, price, originalPrice]);

  // Igual que arriba, pero para la sección de colores/tallas: si el error
  // "Agregá al menos un color..." ya se mostró (después de un intento de
  // guardar) y el admin agrega un color o una talla, el aviso desaparece
  // solo sin necesidad de volver a tocar "Guardar".
  useEffect(() => {
    if (!fieldTouched.colors) return;
    const msg = validateProductField('colors');
    setFieldErrors((prev) => (prev.colors === msg ? prev : { ...prev, colors: msg }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorways]);

  const sizeGuideForGender =
    SIZE_GUIDE_CHIPS[(gender as 'Caballero' | 'Dama' | 'Unisex') || 'Unisex'] || SIZE_GUIDE_CHIPS.Unisex;

  // -- fotos generales del producto --
  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadProductImage(file, setUploadPhase);
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir una de las fotos');
    } finally {
      setUploading(false);
      setUploadPhase(null);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  // -- colores --
  const handleNewColorImageSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingNewColor(true);
    try {
      const url = await uploadProductImage(file, setNewColorUploadPhase);
      setNewColorImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setUploadingNewColor(false);
      setNewColorUploadPhase(null);
      e.target.value = '';
    }
  };

  const handleAddColorway = () => {
    if (!newColorName.trim()) return;
    setColorways((prev) => [
      ...prev,
      {
        key: genKey(),
        id: null,
        name: newColorName.trim(),
        image_url: newColorImage,
        available: true,
        sizes: [],
      },
    ]);
    setNewColorName('');
    setNewColorImage('');
  };

  const handleReplaceColorImage = async (colorKey: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingColorKey(colorKey);
    try {
      const url = await uploadProductImage(file, setColorUploadPhase);
      setColorways((prev) => prev.map((c) => (c.key === colorKey ? { ...c, image_url: url } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setUploadingColorKey(null);
      setColorUploadPhase(null);
      e.target.value = '';
    }
  };

  const handleToggleColorwayAvailable = (colorKey: string) => {
    setColorways((prev) => prev.map((c) => (c.key === colorKey ? { ...c, available: !c.available } : c)));
  };

  const handleRemoveColorway = (colorKey: string) => {
    setColorways((prev) =>
      prev
        .map((c) => (c.key === colorKey ? { ...c, deleted: true } : c))
        // si es un color nuevo (sin id todavía) lo sacamos directo del array
        .filter((c) => c.id || !c.deleted)
    );
  };

  // -- tallas por color --
  // Ciclo de 3 estados por click: no existe -> disponible -> agotada (se
  // conserva la fila con available:false, no se borra) -> click de nuevo la
  // quita del todo. Antes, un solo click en una talla ya agregada la borraba
  // directo de Supabase, así que "marcar agotada" en realidad la eliminaba y
  // el sitio público simplemente dejaba de mostrarla en vez de bloquearla.
  const handleToggleGuideSize = (colorKey: string, size: string) => {
    setColorways((prev) =>
      prev.map((c) => {
        if (c.key !== colorKey) return c;
        const existing = c.sizes.find((s) => s.size === size && !s.deleted);
        if (!existing) {
          return { ...c, sizes: [...c.sizes, { key: genKey(), id: null, size, available: true }] };
        }
        if (existing.available) {
          return {
            ...c,
            sizes: c.sizes.map((s) => (s.key === existing.key ? { ...s, available: false } : s)),
          };
        }
        return {
          ...c,
          sizes: c.sizes
            .map((s) => (s.key === existing.key ? { ...s, deleted: true } : s))
            .filter((s) => s.id || !s.deleted),
        };
      })
    );
  };

  // Mismo concepto para tallas agregadas a mano (fuera de la guía): alterna
  // disponible/agotada sin borrar la fila. El "×" del chip sigue siendo la
  // única forma de eliminarla por completo.
  const handleToggleCustomSizeAvailable = (colorKey: string, sizeKey: string) => {
    setColorways((prev) =>
      prev.map((c) =>
        c.key !== colorKey
          ? c
          : { ...c, sizes: c.sizes.map((s) => (s.key === sizeKey ? { ...s, available: !s.available } : s)) }
      )
    );
  };

  const handleAddCustomSize = (colorKey: string) => {
    const value = (customSizeByColor[colorKey] || '').trim();
    if (!value) return;
    setColorways((prev) =>
      prev.map((c) => {
        if (c.key !== colorKey) return c;
        if (c.sizes.some((s) => s.size === value && !s.deleted)) return c; // evita duplicados
        return { ...c, sizes: [...c.sizes, { key: genKey(), id: null, size: value, available: true }] };
      })
    );
    setCustomSizeByColor((prev) => ({ ...prev, [colorKey]: '' }));
  };

  const handleRemoveSize = (colorKey: string, sizeKey: string) => {
    setColorways((prev) =>
      prev.map((c) => {
        if (c.key !== colorKey) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) => (s.key === sizeKey ? { ...s, deleted: true } : s)).filter((s) => s.id || !s.deleted),
        };
      })
    );
  };

  // -- guardar producto + colores + tallas, todo de una vez --
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validamos todos los campos ANTES de intentar guardar, en vez de
    // dejar que Supabase rechace (o guarde a medias) datos inválidos.
    const fieldsToValidate: ProductField[] = ['name', 'brand', 'style', 'gender', 'price', 'originalPrice', 'colors'];
    const newErrors: Partial<Record<ProductField, string>> = {};
    fieldsToValidate.forEach((field) => {
      const fieldError = validateProductField(field);
      if (fieldError) newErrors[field] = fieldError;
    });

    const newTouched: Partial<Record<ProductField, boolean>> = {};
    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
    });
    setFieldTouched(newTouched);
    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = fieldsToValidate.find((field) => newErrors[field]);
      if (firstErrorField) {
        const inputElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
        inputElement?.focus();
      }
      return;
    }

    const input = {
      name: name.trim(),
      brand: brand.trim(),
      category: GENDER_TO_CATEGORY[gender] || 'unisex',
      gender,
      style: style.trim(),
      description: description.trim(),
      images,
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : null,
      rating: Number(rating) || 4.8,
      is_new: isNew,
      is_hot: isHot,
      status,
    };

    setSaving(true);
    try {
      let productId: string;
      if (isEditing && product) {
        await updateProduct(product.id, input);
        productId = product.id;
        await logFieldChanges(product, input);
      } else {
        const created = await createProduct(input);
        productId = created.id;
        await logProductChange(productId, input.name, 'created', null, null, null);
      }

      await saveColorways(productId);

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Compara el producto original contra los valores nuevos del formulario y
  // registra en product_history una fila por cada campo que cambió.
  const FIELD_LABELS: Record<string, string> = {
    name: 'Nombre',
    brand: 'Marca',
    gender: 'Género',
    style: 'Categoría',
    description: 'Descripción',
    price: 'Precio',
    original_price: 'Precio anterior',
    rating: 'Rating',
    is_new: 'Nuevo',
    is_hot: 'Destacado',
    status: 'Estado',
  };

  const logFieldChanges = async (original: DbProduct, input: Record<string, unknown>) => {
    const originalValues: Record<string, unknown> = {
      name: original.name,
      brand: original.brand,
      gender: original.gender,
      style: original.style,
      description: original.description,
      price: original.price,
      original_price: original.original_price,
      rating: original.rating,
      is_new: original.is_new,
      is_hot: original.is_hot,
      status: original.status,
    };

    for (const field of Object.keys(FIELD_LABELS)) {
      const oldVal = originalValues[field];
      const newVal = input[field];
      if (oldVal === newVal) continue;
      if ((oldVal ?? '') === (newVal ?? '')) continue;
      await logProductChange(
        original.id,
        input.name as string,
        'updated',
        FIELD_LABELS[field],
        oldVal === null || oldVal === undefined ? null : String(oldVal),
        newVal === null || newVal === undefined ? null : String(newVal)
      );
    }
  };

  // Reconcilia el estado local de colores/tallas con Supabase:
  // crea lo nuevo, actualiza lo que cambió, borra lo marcado.
  const saveColorways = async (productId: string) => {
    const original = colorwaysFromProduct(product);

    for (const c of colorways) {
      if (c.id && c.deleted) {
        await deleteColorway(c.id);
        continue;
      }
      if (c.deleted) continue; // nuevo y borrado antes de guardar: no hace nada

      if (c.id) {
        // Color existente: actualizar solo si cambió algo
        const orig = original.find((o) => o.id === c.id);
        if (orig && (orig.name !== c.name || orig.image_url !== c.image_url || orig.available !== c.available)) {
          await updateColorway(c.id, { name: c.name, image_url: c.image_url, available: c.available });
        }
        for (const s of c.sizes) {
          if (s.id && s.deleted) {
            await deleteSize(s.id);
          } else if (s.id && !s.deleted) {
            const origSize = orig?.sizes.find((os) => os.id === s.id);
            if (origSize && origSize.available !== s.available) {
              await updateSize(s.id, s.available);
            }
          } else if (!s.id && !s.deleted) {
            await addSize(c.id, s.size, s.available);
          }
        }
      } else {
        // Color nuevo: se crea recién ahora, junto con sus tallas
        const created = await addColorway(productId, c.name, c.image_url);
        for (const s of c.sizes) {
          if (!s.deleted) await addSize(created.id, s.size, s.available);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-[28px] shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 sticky top-0 bg-white rounded-t-[28px] z-10">
          <h2 className="font-display font-bold text-lg text-slate-900">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre del modelo *
            </label>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              placeholder="Ej: New Balance 9060"
              className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                fieldErrors.name && fieldTouched.name
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                  : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
              }`}
            />
            {fieldErrors.name && fieldTouched.name && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Marca *
              </label>
              <input
                name="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                onBlur={() => handleFieldBlur('brand')}
                placeholder="Nike, Adidas..."
                className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                  fieldErrors.brand && fieldTouched.brand
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                    : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
                }`}
              />
              {fieldErrors.brand && fieldTouched.brand && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {fieldErrors.brand}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Género
              </label>
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                onBlur={() => handleFieldBlur('gender')}
                className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                  fieldErrors.gender && fieldTouched.gender
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                    : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
                }`}
              >
                <option value="Dama">Dama</option>
                <option value="Caballero">Caballero</option>
                <option value="Unisex">Unisex</option>
              </select>
              {fieldErrors.gender && fieldTouched.gender && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {fieldErrors.gender}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Categoría (estilo de la ficha)
            </label>
            <select
              name={showCustomStyle ? undefined : 'style'}
              value={showCustomStyle ? OTHER_STYLE : style}
              onChange={(e) => {
                if (e.target.value === OTHER_STYLE) {
                  setShowCustomStyle(true);
                  setStyle('');
                } else {
                  setShowCustomStyle(false);
                  setStyle(e.target.value);
                }
              }}
              onBlur={() => handleFieldBlur('style')}
              className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                fieldErrors.style && fieldTouched.style
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                  : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
              }`}
            >
              {existingStyles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value={OTHER_STYLE}>+ Otra (nueva categoría)</option>
            </select>

            {showCustomStyle && (
              <input
                name="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                onBlur={() => handleFieldBlur('style')}
                placeholder="Nombre de la nueva categoría (ej: Deportivo)"
                autoFocus
                className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all mt-2 ${
                  fieldErrors.style && fieldTouched.style
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                    : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
                }`}
              />
            )}
            {fieldErrors.style && fieldTouched.style && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                {fieldErrors.style}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descripción del modelo, en el tono de Trespa Store"
              className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Fotos del producto
            </label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((url) => (
                  <div key={url} className="relative w-16 h-16 shrink-0 group">
                    <img
                      src={url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm"
                      title="Quitar foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold cursor-pointer hover:border-brand-blue hover:text-brand-blue transition-colors">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {uploadPhase ? PHASE_LABEL[uploadPhase] : 'Subiendo...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Elegir fotos (cámara o galería)
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFilesSelected}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {images.length === 0 && !uploading && (
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                <ImageOff className="w-3.5 h-3.5" /> Todavía no agregaste fotos
              </p>
            )}
          </div>

          {/* ================= COLORES Y TALLAS (todo en el mismo formulario) ================= */}
          <div className="pt-2 border-t border-slate-50">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Colores y tallas
              </label>
              <button
                type="button"
                onClick={() => setShowSizeGuide((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSizeGuide ? 'rotate-180' : ''}`} />
                {showSizeGuide ? 'Ocultar' : 'Ver'} guía de tallas
              </button>
            </div>

            {showSizeGuide && (
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {(['Hombre', 'Mujer'] as const).map((g) => (
                  <div key={g} className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-slate-900 text-white text-center text-[11px] font-bold py-1.5 tracking-wide">
                      TALLAS {g.toUpperCase()}
                    </div>
                    <table className="w-full text-center text-[11px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="py-1 font-bold text-brand-blue bg-sky-50">EUR</th>
                          <th className="py-1 font-semibold">CO</th>
                          <th className="py-1 font-semibold">US</th>
                          <th className="py-1 font-semibold">CM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SIZE_GUIDE_TABLE[g].map((row) => (
                          <tr key={row.eur} className="border-b border-slate-50 last:border-0">
                            <td className="py-1 font-bold text-brand-blue bg-sky-50/60">{row.eur}</td>
                            <td className="py-1 text-slate-500">{row.co}</td>
                            <td className="py-1 text-slate-500">{row.us}</td>
                            <td className="py-1 text-slate-500">{row.cm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-400 mb-3">
              Elegí siempre la talla en <span className="font-semibold text-brand-blue">EUR</span> (columna
              destacada) — es la que viene marcada en la caja del proveedor y la misma que ve el cliente en la
              ficha del producto.
            </p>

            {fieldErrors.colors && fieldTouched.colors && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fieldErrors.colors}</span>
              </div>
            )}

            <div className="space-y-3">
              {colorways
                .filter((c) => !c.deleted)
                .map((c) => (
                  <div key={c.key} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <label
                        className="relative w-10 h-10 shrink-0 cursor-pointer group"
                        title={
                          uploadingColorKey === c.key
                            ? colorUploadPhase
                              ? PHASE_LABEL[colorUploadPhase]
                              : 'Subiendo...'
                            : undefined
                        }
                      >
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Upload className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                          {uploadingColorKey === c.key ? (
                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleReplaceColorImage(c.key, e)}
                          disabled={uploadingColorKey === c.key}
                          className="hidden"
                        />
                      </label>

                      <input
                        value={c.name}
                        onChange={(e) =>
                          setColorways((prev) =>
                            prev.map((cw) => (cw.key === c.key ? { ...cw, name: e.target.value } : cw))
                          )
                        }
                        placeholder="Nombre del color (ej: Azul/Vino)"
                        className="flex-1 min-w-0 text-sm font-semibold px-3 py-2 bg-slate-50/60 border border-slate-100 rounded-xl outline-none focus:border-brand-blue"
                      />

                      <button
                        type="button"
                        onClick={() => handleToggleColorwayAvailable(c.key)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                          c.available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {c.available ? 'Disponible' : 'Agotado'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveColorway(c.key)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Quitar color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Tallas disponibles (EUR)
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Click: agregar → agotada → quitar
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeGuideForGender.map((size) => {
                          const entry = c.sizes.find((s) => s.size === size && !s.deleted);
                          const state: 'none' | 'available' | 'unavailable' = !entry
                            ? 'none'
                            : entry.available
                            ? 'available'
                            : 'unavailable';
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleToggleGuideSize(c.key, size)}
                              title={
                                state === 'none'
                                  ? 'Agregar talla'
                                  : state === 'available'
                                  ? 'Disponible — click para marcar agotada'
                                  : 'Agotada — click para quitarla'
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                state === 'available'
                                  ? 'bg-brand-blue text-white border-brand-blue'
                                  : state === 'unavailable'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200 line-through'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-brand-blue hover:text-brand-blue'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}

                        {c.sizes
                          .filter((s) => !s.deleted && !sizeGuideForGender.includes(s.size))
                          .map((s) => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => handleToggleCustomSizeAvailable(c.key, s.key)}
                              title={s.available ? 'Disponible — click para marcar agotada' : 'Agotada — click para volver a disponible'}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                s.available
                                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'
                                  : 'bg-amber-50 text-amber-600 border-amber-200 line-through'
                              }`}
                            >
                              {s.size}
                              <span
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSize(c.key, s.key);
                                }}
                                title="Quitar talla"
                                className="hover:text-rose-600"
                              >
                                ×
                              </span>
                            </button>
                          ))}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <input
                          value={customSizeByColor[c.key] || ''}
                          onChange={(e) => setCustomSizeByColor((prev) => ({ ...prev, [c.key]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomSize(c.key);
                            }
                          }}
                          placeholder="Otra talla (fuera de la guía)"
                          className="text-xs px-3 py-2 bg-slate-50/60 border border-slate-100 rounded-xl flex-1 min-w-0 outline-none focus:border-brand-blue"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSize(c.key)}
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-brand-blue hover:text-brand-blue transition-colors shrink-0"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Agregar nuevo color */}
              <div className="border border-dashed border-slate-200 rounded-2xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Agregar color
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  <input
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColorway();
                      }
                    }}
                    placeholder="Nombre del color (ej: Azul/Vino)"
                    className="flex-1 w-full text-sm px-3 py-2.5 bg-slate-50/60 border border-slate-100 rounded-xl outline-none focus:border-brand-blue"
                  />

                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer hover:border-brand-blue hover:text-brand-blue transition-colors shrink-0">
                    {uploadingNewColor ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : newColorImage ? (
                      <img src={newColorImage} alt="" className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingNewColor
                      ? newColorUploadPhase
                        ? PHASE_LABEL[newColorUploadPhase]
                        : 'Subiendo...'
                      : newColorImage
                      ? 'Cambiar foto'
                      : 'Elegir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleNewColorImageSelected}
                      disabled={uploadingNewColor}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={uploadingNewColor}
                    onClick={handleAddColorway}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-brand-blue text-white hover:bg-slate-950 transition-colors shrink-0 disabled:opacity-60"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* =============================================================================== */}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Precio (COP) *
              </label>
              <input
                name="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => handleFieldBlur('price')}
                placeholder="180000"
                className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                  fieldErrors.price && fieldTouched.price
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                    : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
                }`}
              />
              {fieldErrors.price && fieldTouched.price && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {fieldErrors.price}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Precio anterior
              </label>
              <input
                name="originalPrice"
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                onBlur={() => handleFieldBlur('originalPrice')}
                placeholder="Opcional"
                className={`w-full text-sm px-4 py-3 border outline-none rounded-2xl transition-all ${
                  fieldErrors.originalPrice && fieldTouched.originalPrice
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                    : 'border-slate-100 focus:border-brand-blue bg-slate-50/60'
                }`}
              />
              {fieldErrors.originalPrice && fieldTouched.originalPrice && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {fieldErrors.originalPrice}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-4 h-4 accent-brand-blue" />
              Marcar como nuevo
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} className="w-4 h-4 accent-brand-blue" />
              Marcar como destacado
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DbStatus)}
              className="w-full text-sm px-4 py-3 bg-slate-50/60 border border-slate-100 focus:border-brand-blue outline-none rounded-2xl"
            >
              <option value="disponible">Disponible</option>
              <option value="agotado">Agotado</option>
              <option value="proximamente">Próximamente</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-3 rounded-2xl bg-brand-blue hover:bg-slate-950 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
