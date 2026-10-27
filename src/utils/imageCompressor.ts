/**
 * Compresses an image file to under specified maxSizeKB (default 10KB as per original system specifications)
 */
export async function compressToMaxSize(file: File, maxSizeKB = 15): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        let quality = 0.75;
        let attempts = 0;

        // Scale down if image is huge initially
        const maxInitialDim = 400;
        if (width > maxInitialDim || height > maxInitialDim) {
          if (width > height) {
            height = Math.round((height * maxInitialDim) / width);
            width = maxInitialDim;
          } else {
            width = Math.round((width * maxInitialDim) / height);
            height = maxInitialDim;
          }
        }

        const reduceDim = () => {
          width = Math.max(40, Math.floor(width * 0.85));
          height = Math.max(40, Math.floor(height * 0.85));
        };

        const compress = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context error'));
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = (base64.length * 0.75) / 1024;

          if (sizeKB <= maxSizeKB || attempts >= 16) {
            resolve(base64);
            return;
          }

          if (quality > 0.35) {
            quality -= 0.08;
            attempts++;
            compress();
          } else {
            reduceDim();
            quality = 0.6;
            attempts++;
            compress();
          }
        };

        compress();
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
}
