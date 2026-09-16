// =========================================================================
// OPTIMIZADOR DE IMÁGENES (Canvas API, sin librerías externas)
// =========================================================================
// Antes de subir cualquier foto a Supabase Storage, la pasamos por acá:
// se redimensiona (si es más ancha de 900px) y se recomprime a WebP con
// calidad 0.8. Esto reduce bastante el peso de las fotos que suben desde
// el celular (que suelen venir en 3000-4000px y varios MB) sin que se note
// pérdida de nitidez en el catálogo — las tarjetas de producto nunca se
// muestran más anchas que eso en pantalla.
//
// Si el archivo no es una imagen (por ejemplo un video en Testimonios) o
// algo falla en el proceso (canvas no soporta WebP, imagen corrupta, etc.),
// se devuelve el archivo original tal cual — nunca debe bloquear la subida.

const MAX_WIDTH = 900;
const WEBP_QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('El navegador no pudo generar el WebP'));
      },
      'image/webp',
      WEBP_QUALITY
    );
  });
}

function withWebpExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${base}.webp`;
}

// Convierte y comprime una imagen a WebP. Si el archivo no es una imagen,
// o si algo falla en el proceso, devuelve el archivo original sin tocar.
export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const img = await loadImage(file);

    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    if (!targetWidth || !targetHeight) return file;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const webpBlob = await canvasToWebpBlob(canvas);
    return new File([webpBlob], withWebpExtension(file.name), { type: 'image/webp' });
  } catch {
    // Navegador viejo, imagen corrupta, canvas bloqueado, etc. — seguimos
    // con el archivo original en vez de romper la subida.
    return file;
  }
}
