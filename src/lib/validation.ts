// =========================================================================
// VALIDACIONES COMPARTIDAS
// =========================================================================
// Reglas de validación reutilizadas por varios formularios (checkout
// público y panel de administración) para no repetir la misma lógica en
// cada uno. Cada función devuelve un mensaje de error corto y claro, o
// una cadena vacía si el valor es válido — mismo contrato que ya usaba
// CheckoutModal.tsx.

// Celular colombiano "nacional" (sin código de país): empieza en 3 y tiene
// exactamente 10 dígitos. Es el mismo criterio que ya validaba el campo
// "phone" del checkout.
export function validateColombianMobile(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'El número de celular es obligatorio';
  if (!/^\d+$/.test(trimmed)) return 'El celular debe contener solo números';
  if (!trimmed.startsWith('3')) return 'El celular debe iniciar con 3 (Ej: 3012345678)';
  if (trimmed.length !== 10) return 'El celular debe tener exactamente 10 dígitos';
  return '';
}

// Número de WhatsApp completo con código de país, tal como se guarda en
// site_settings.whatsapp_number: "57" + el número nacional de 10 dígitos.
// Reusa validateColombianMobile para la parte nacional en vez de duplicar
// la regla del celular.
export function validateColombianWhatsappNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'El número de WhatsApp es obligatorio';
  if (!/^\d+$/.test(trimmed)) return 'El número debe contener solo dígitos, sin espacios ni el símbolo +';
  if (!trimmed.startsWith('57')) return 'Debe iniciar con el código de país 57 (Ej: 573001234567)';

  const nationalPart = trimmed.slice(2);
  const nationalError = validateColombianMobile(nationalPart);
  if (nationalError) {
    return 'Debe tener el formato 57 + 10 dígitos que empiecen en 3 (Ej: 573001234567)';
  }
  return '';
}

// URL básica: si viene vacía se considera válida (campo opcional en varios
// formularios); si trae contenido, debe empezar con https://.
export function validateHttpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!/^https:\/\/.+/i.test(trimmed)) return 'Debe ser un enlace válido que empiece con https://';
  return '';
}

// Texto obligatorio genérico (nombre, marca, categoría, etc.), con largo
// mínimo configurable.
export function validateRequiredText(value: string, fieldLabel: string, minLength = 1): string {
  const trimmed = value.trim();
  if (!trimmed) return `${fieldLabel} es obligatorio`;
  if (trimmed.length < minLength) return `${fieldLabel} debe tener al menos ${minLength} caracteres`;
  return '';
}

// Email básico: obligatorio y con formato usuario@dominio.
export function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'El email es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresa un email válido';
  return '';
}

// Precio: obligatorio y mayor a 0.
export function validatePositivePrice(value: string, fieldLabel = 'El precio'): string {
  const trimmed = value.trim();
  if (!trimmed) return `${fieldLabel} es obligatorio`;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return `${fieldLabel} debe ser un número`;
  if (num <= 0) return `${fieldLabel} debe ser mayor a 0`;
  return '';
}
