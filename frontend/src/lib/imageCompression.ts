/**
 * High-performance client-side image compression utility.
 * Resizes and compresses images in the browser using HTML5 Canvas & WebP/JPEG.
 * Shrinks 5-15MB smartphone photos down to <500KB without visual quality loss.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  previewUrl: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  // If not an image, return original
  if (!file.type.startsWith('image/')) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercentage: 0,
      previewUrl,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Maintain aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original
        const previewUrl = URL.createObjectURL(file);
        return resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          reductionPercentage: 0,
          previewUrl,
        });
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format (use jpeg fallback if webp not supported)
      let outputMime = mimeType;
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const isWebpSupported = testCanvas.toDataURL('image/webp').startsWith('data:image/webp');
      if (!isWebpSupported && outputMime === 'image/webp') {
        outputMime = 'image/jpeg';
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const previewUrl = URL.createObjectURL(file);
            return resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              reductionPercentage: 0,
              previewUrl,
            });
          }

          const extension = outputMime === 'image/webp' ? '.webp' : '.jpg';
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + extension;

          const compressedFile = new File([blob], cleanName, {
            type: outputMime,
            lastModified: Date.now(),
          });

          const compressedPreviewUrl = URL.createObjectURL(compressedFile);
          const reduction = Math.max(0, Math.round(((file.size - compressedFile.size) / file.size) * 100));

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            reductionPercentage: reduction,
            previewUrl: compressedPreviewUrl,
          });
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        reductionPercentage: 0,
        previewUrl,
      });
    };

    img.src = objectUrl;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
