import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, Sparkles, CheckCircle, CheckCircle2, Landmark, Building, FileText, MessageSquare, Mail, ClipboardList, MessageCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, CheckoutData } from '../types';
import { useSiteSettings } from '../lib/settings';
import { createOrderFromCheckout } from '../lib/orders';
import { validateColombianMobile } from '../lib/validation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
}: CheckoutModalProps) {
  const { whatsappNumber } = useSiteSettings();
  const [formData, setFormData] = useState<CheckoutData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    cedula: '',
    observaciones: '',
    paymentMethod: 'bold_tarjeta',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');


  // Real-time validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'El nombre completo es obligatorio';
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        break;
      case 'email': {
        const emailTrimmed = value.trim();
        if (!emailTrimmed) return 'El correo electrónico es obligatorio';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailTrimmed)) {
          return 'Por favor ingresa un correo electrónico válido (Ej: usuario@correo.com)';
        }
        break;
      }  
      case 'cedula':
        if (!value.trim()) return 'La cédula es obligatoria';
        if (!/^\d+$/.test(value.trim())) return 'La cédula debe contener solo números';
        if (value.trim().length < 5) return 'La cédula debe tener al menos 5 dígitos';
        break;
      case 'phone':
        return validateColombianMobile(value);
      case 'city':
        if (!value.trim()) return 'La ciudad es obligatoria';
        if (value.trim().length < 3) return 'Ingresa una ciudad válida';
        break;
      case 'address':
        if (!value.trim()) return 'La dirección de entrega es obligatoria';
        if (value.trim().length < 8) return 'Por favor ingresa una dirección de entrega más detallada (Ej: Calle 45 #12-34)';
        break;
      default:
        break;
    }
    return '';
  };

  // Format currency helper
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const total = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Saneamiento en tiempo real para el número de celular/WhatsApp
    let cleanedValue = value;
    if (name === 'phone') {
      // Permitir solo dígitos numéricos y un máximo de 10 caracteres
      cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanedValue,
    }));

    // Validación inmediata en tiempo real para el celular/WhatsApp, y para los demás campos después de ser "touched"
    if (name === 'phone') {
      const error = validateField(name, cleanedValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    } else if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handlePaymentMethodChange = (method: 'bold_tarjeta' | 'transferencia') => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields on submit
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['fullName','email', 'cedula', 'phone', 'city', 'address'];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field as keyof CheckoutData] as string || '');
      if (error) {
        newErrors[field] = error;
      }
    });

    // Mark all as touched to show errors
    const newTouched: Record<string, boolean> = {};
    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first field with error
      const firstErrorField = fieldsToValidate.find((field) => newErrors[field]);
      if (firstErrorField) {
        const inputElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
        if (inputElement) {
          inputElement.focus();
        }
      }
      return;
    }

    setIsSubmitting(true);

    // Registramos la solicitud en el panel (para la pestaña "Ventas") antes
    // de abrir WhatsApp. Si esto falla (sin internet, Supabase caído, etc.)
    // NO bloqueamos el checkout: WhatsApp sigue siendo el canal real donde
    // se cierra la venta, este registro es solo un plus para el dueño.
    try {
      await createOrderFromCheckout(cartItems, formData, total);
    } catch (err) {
      console.error('No se pudo registrar la solicitud en el panel:', err);
    }

    // Format payment method text
    const paymentMethodText =
      formData.paymentMethod === 'bold_tarjeta'
        ? 'Tarjeta de Crédito/Débito (Pasarela Segura Bold)'
        : 'Transferencia Bancaria (Bancolombia, Nequi, Nu o Lulo)';

    // =========================================================================
    // 4. GENERACIÓN DE MENSAJE DETALLADO PARA WHATSAPP
    // =========================================================================
    // Aquí es donde la magia ocurre. Vamos a construir una cadena de texto (string)
    // extremadamente detallada con la información del cliente y cada zapato que eligió.
    //
    // Conceptos clave para aprender:
    // 1. "Template Literals" (Plantillas de cadena): Usamos las comillas invertidas ` `
    //    que nos permiten escribir texto multilínea y meter variables directamente usando ${variable}.
    // 2. "Escape de caracteres": Usamos saltos de línea (\n) para que el mensaje en WhatsApp
    //    se reciba perfectamente formateado, con párrafos y espacios limpios.
    // 3. Negritas en WhatsApp: El formato de WhatsApp usa asteriscos (*texto*) para colocar
    //    letras en negrita, y guiones bajos (_texto_) para cursiva.

    let message = `👟 *¡NUEVO PEDIDO - TRESPA STORE!* 👟\n`;
    message += `==================================\n`;
    message += `Hola *Trespa Store*, acabo de completar un pedido en la tienda online. `;
    message += `Aquí tienes todos los detalles listos para el despacho:\n\n`;
    
    // Sección: Información de entrega y contacto del cliente
    message += `👤 *DATOS DE FACTURACIÓN Y ENVÍO:*\n`;
    message += `• *Cliente:* ${formData.fullName.trim()}\n`;
    message += `• *Correo:* ${formData.email.trim()}\n`;
    message += `• *Cédula:* ${formData.cedula.trim()}\n`;
    message += `• *Celular:* ${formData.phone.trim()}\n`;
    message += `• *Ciudad:* ${formData.city.trim()}\n`;
    message += `• *Dirección:* ${formData.address.trim()}\n`;
    message += `• *Método de Pago:* ${paymentMethodText}\n`;
    if (formData.observaciones?.trim()) {
      message += `• *Observaciones/Notas:* "${formData.observaciones.trim()}"\n`;
    }
    message += `\n`;

    // Sección: Listado detallado de productos
    // Usamos el ciclo "forEach" de JavaScript para recorrer la lista de productos del carrito (cartItems).
    // Por cada elemento ("item"), sumamos la información correspondiente al mensaje general.
    message += `📦 *DETALLES DEL PRODUCTO(S):*\n`;
    cartItems.forEach((item, index) => {
      const itemSubtotal = item.product.price * item.quantity;

      const getAbsoluteImgUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
          return path;
        }
        return `${window.location.origin}${path}`;
      };
      const imgUrl = getAbsoluteImgUrl(item.selectedColorImage || item.product.image);
      
      message += `*Item #${index + 1}: ${item.product.name.toUpperCase()}*\n`;
      message += `   - *Marca:* ${item.product.brand}\n`;
      message += `   - *Categoría:* ${item.product.category}\n`;
      message += `   - *Talla seleccionada:* EUR ${item.selectedSize}\n`;
      message += `   - *Color elegido:* ${item.selectedColor}\n`;
      message += `   - *Cantidad:* ${item.quantity} par(es)\n`;
      message += `   - *Precio unitario:* ${formatPrice(item.product.price)}\n`;
      message += `   - *Enlace de referencia visual (Foto):* ${imgUrl}\n`;
      message += `   - *Subtotal de este calzado:* ${formatPrice(itemSubtotal)}\n`;
      message += `   ----------------------------------\n`;
    });
    message += `\n`;

    // Sección: Resumen final de costos
    message += `💵 *RESUMEN DE LA TRANSACCIÓN:*\n`;
    message += `• *Subtotal Productos:* ${formatPrice(total)}\n`;
    message += `• *Costo de Envío:* ¡GRATIS! 🇨🇴 (Todo Colombia)\n`;
    message += `• *VALOR TOTAL A PAGAR:* ${formatPrice(total)} COP\n\n`;

    message += `💬 _Quedo en espera de tu confirmación para proceder con el pago y envío de mi pedido. ¡Muchas gracias!_`;

    // =========================================================================
    // ENLACE DE WHATSAPP CON ENCODING SEGURO (encodeURIComponent)
    // =========================================================================
    // El navegador no puede enviar emojis, espacios o saltos de línea directo en una URL.
    // Por eso usamos "encodeURIComponent()", que convierte de forma segura todo nuestro mensaje
    // de texto en una cadena codificada para internet (por ejemplo, los espacios se vuelven %20).
    //
    // Usamos el número de destino configurado en el panel de administración
    // (Configuración > Número de WhatsApp), con respaldo si no cargó todavía.
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        setWhatsappUrl(waUrl);


    setTimeout(() => {
      // "window.open" abre el enlace generado en una pestaña nueva del navegador del cliente,
      // llevándolo directo a su chat de WhatsApp con el mensaje ya escrito en la caja de texto.
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };
  
  const handleFinish = () => {
    onOrderSuccess();
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={isSuccess ? undefined : onClose}
            className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              id="checkout-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col relative"
            >
              {!isSuccess ? (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-sky/10 flex items-center justify-center text-brand-blue">
                        <ClipboardList className="w-4 h-4 animate-pulse" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900">
                        Enviar Solicitud
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Nombre Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Ej: Camilo Torres"
                        className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${errors.fullName && touched.fullName
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                          }`}
                      />
                      {errors.fullName && touched.fullName && (
                        <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                          <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                      {/* Correo Electrónico */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Ej: camilo@correo.com"
                        className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                          errors.email && touched.email
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                        }`}
                      />
                      {errors.email && touched.email && (
                        <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                          <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Cédula and Celular Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cédula */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Cédula de Ciudadanía <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="cedula"
                          value={formData.cedula}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="Ej: 10203040"
                          className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${errors.cedula && touched.cedula
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                              : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                            }`}
                        />
                        {errors.cedula && touched.cedula && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            {errors.cedula}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Número de Celular (WhatsApp) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="Ej: 3001234567"
                          className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${errors.phone && touched.phone
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                              : formData.phone.length === 10 && !errors.phone
                              ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-emerald-50/10'
                              : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                            }`}
                        />
                        {errors.phone && touched.phone ? (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            {errors.phone}
                          </p>
                        ) : formData.phone.length === 10 && !errors.phone ? (
                          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Formato de WhatsApp válido para recibir tu pedido</span>
                          </p>
                        ) : formData.phone.length > 0 ? (
                          <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                            <span>Escribe los 10 dígitos (Faltan {10 - formData.phone.length})</span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Ciudad and Dirección Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Ciudad */}
                      <div className="sm:col-span-1 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          Ciudad / Municipio <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={handleBlur}

                          required
                          placeholder="Ej: Medellín"
                          className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${errors.city && touched.city
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                              : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                            }`}
                        />
                        {errors.city && touched.city && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            {errors.city}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Dirección de Entrega <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          onBlur={handleBlur}

                          required
                          placeholder="Ej: Calle 45 #12-34, Apto 301"
                          className={`w-full text-sm px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 ${errors.address && touched.address
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/10'
                              : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 bg-white'
                            }`}
                        />
                        {errors.address && touched.address && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1.5 animate-fadeIn">
                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            {errors.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Observaciones (Opcional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Observaciones / Notas (Opcional)
                      </label>
                      <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Ej: Dejar en portería, color de cordones adicional, etc."
                        className="w-full text-sm px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all placeholder:text-slate-400 resize-none"
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        Método de Pago <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handlePaymentMethodChange('bold_tarjeta')}
                          className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${formData.paymentMethod === 'bold_tarjeta'
                              ? 'border-brand-blue bg-brand-sky/10 text-slate-900 ring-2 ring-brand-sky/20'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                        >
                          <span className="text-xs font-bold font-display flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Pago con Tarjeta (Bold)
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight">
                            Paga de forma 100% segura con tu tarjeta débito/crédito vía link de Bold.
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentMethodChange('transferencia')}
                          className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${formData.paymentMethod === 'transferencia'
                              ? 'border-brand-blue bg-brand-sky/10 text-slate-900 ring-2 ring-brand-sky/20'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                        >
                          <span className="text-xs font-bold font-display flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5" /> Transferencia Directa
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight">
                            Bancolombia, Nequi, Nu o Lulo. Envías el comprobante.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Order summary small banner */}
                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                          Total a pagar
                        </span>
                        <p className="text-lg font-bold font-display text-slate-900">
                          {formatPrice(total)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        Envío Gratis Incluido
                      </span>
                    </div>

                    {/* Proceso de compra banner */}
                    <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4 text-left space-y-2.5">
                      <h4 className="text-[10px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-brand-blue" />
                        ¿Qué pasa al hacer clic abajo?
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-800 mb-0.5">1. Chat de WhatsApp</div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Se abrirá un chat con tu mensaje de pedido pre-listo.
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-800 mb-0.5">2. Pago Seguro</div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Confirmamos disponibilidad y te enviamos link de Bold o Cuenta.
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-800 mb-0.5">3. Despacho Gratis</div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Empacamos tu calzado y te compartimos la guía de envío por medio de WhatsApp.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-brand-blue hover:bg-brand-blue/95 disabled:bg-brand-blue/50 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-brand-blue/10 hover:shadow-brand-blue/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Confirmar y Enviar a WhatsApp'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Vista de éxito con hoja de ruta de próximos pasos*/
                <div className="p-8 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-5"
                  >
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2 text-center">
                    ¡Solicitud Enviada con Éxito!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-6 text-center leading-relaxed">
                    Hemos abierto tu chat de WhatsApp con los detalles del pedido pre-cargados. Si tu navegador bloqueó la ventana, puedes usar el botón de abajo.
                  </p>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl mb-8 transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      Enviar Solicitud por WhatsApp
                    </a>
                  )}

                  {/* Beautiful visual next steps timeline */}
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
                      ¿Qué pasa a continuación?
                    </h4>
                    
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-brand-sky/10 flex items-center justify-center text-[10px] font-bold text-brand-blue flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                          Envías el Mensaje en WhatsApp
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                          En el chat que se abrió, presiona "Enviar". Ese mensaje contiene todas tus tallas y datos listos.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start border-t border-slate-100/80 pt-3">
                      <div className="w-6 h-6 rounded-full bg-brand-sky/10 flex items-center justify-center text-[10px] font-bold text-brand-blue flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                          Confirmamos Disponibilidad y Pago
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                          Un asesor validará tu inventario en segundos y te enviará el link de pago seguro de Bold (tarjetas) o datos de transferencia.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start border-t border-slate-100/80 pt-3">
                      <div className="w-6 h-6 rounded-full bg-brand-sky/10 flex items-center justify-center text-[10px] font-bold text-brand-blue flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          Envío Gratis y Rastreo Nacional
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                          Una vez verificado, empacamos tus zapatos y te enviamos la guía para que rastrees tu pedido sin costo adicional.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="w-full max-w-xs py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
                  >
                    Entendido, Volver a la Tienda
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
