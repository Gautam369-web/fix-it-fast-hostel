/**
 * Client-side image compression via offscreen Canvas.
 * Resizes images to max 960px dimension and encodes to WebP/JPEG (~72% quality)
 * so resident & staff uploads stay fast, offline-friendly, and tiny in storage.
 */
export async function compressImageFile(
  file: File,
  maxDim = 960,
  quality = 0.72,
  onProgress?: (pct: number) => void
): Promise<string> {
  onProgress?.(15);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
  onProgress?.(45);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image format'));
    el.src = dataUrl;
  });
  onProgress?.(70);

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height / width) * maxDim);
      width = maxDim;
    } else {
      width = Math.round((width / height) * maxDim);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  onProgress?.(90);
  const compressed = canvas.toDataURL('image/webp', quality);
  onProgress?.(100);
  return compressed.startsWith('data:image/webp') ? compressed : canvas.toDataURL('image/jpeg', quality);
}
