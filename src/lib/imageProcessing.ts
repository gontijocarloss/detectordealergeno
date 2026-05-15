/**
 * Utilitário de processamento de imagem para melhorar a detecção de código de barras
 */

export interface ProcessedImage {
  original: string;
  grayscale: string;
  highContrast: string;
  sharpened: string;
  thresholded: string;
}

/**
 * Carrega uma imagem base64 em um HTMLImageElement
 */
export const loadImageFromBase64 = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
};

/**
 * Converte imagem para escala de cinza
 */
export const toGrayscale = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = avg;     // R
    data[i + 1] = avg; // G
    data[i + 2] = avg; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Aumenta o contraste da imagem
 */
export const increaseContrast = (ctx: CanvasRenderingContext2D, width: number, height: number, factor: number = 1.5): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const intercept = 128 * (1 - factor);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
    data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
    data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Aplica sharpening na imagem usando convolução
 */
export const sharpenImage = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const originalData = new Uint8ClampedArray(data);
  
  // Kernel de sharpening
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += originalData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        data[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Aplica threshold adaptativo para binarização
 */
export const applyThreshold = (ctx: CanvasRenderingContext2D, width: number, height: number, threshold: number = 128): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = avg > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Ajusta brilho da imagem
 */
export const adjustBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number, amount: number = 20): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + amount));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + amount));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + amount));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Cria múltiplas versões processadas da imagem para tentativas de scan
 */
export const processImageForBarcode = async (base64Image: string): Promise<string[]> => {
  const img = await loadImageFromBase64(base64Image);
  const { width, height } = img;
  
  const processedImages: string[] = [];
  
  // 1. Imagem original
  processedImages.push(base64Image);
  
  // 2. Escala de cinza
  const grayCanvas = document.createElement('canvas');
  grayCanvas.width = width;
  grayCanvas.height = height;
  const grayCtx = grayCanvas.getContext('2d')!;
  grayCtx.drawImage(img, 0, 0);
  toGrayscale(grayCtx, width, height);
  processedImages.push(grayCanvas.toDataURL('image/jpeg', 0.95));
  
  // 3. Escala de cinza + alto contraste
  const contrastCanvas = document.createElement('canvas');
  contrastCanvas.width = width;
  contrastCanvas.height = height;
  const contrastCtx = contrastCanvas.getContext('2d')!;
  contrastCtx.drawImage(img, 0, 0);
  toGrayscale(contrastCtx, width, height);
  increaseContrast(contrastCtx, width, height, 1.8);
  processedImages.push(contrastCanvas.toDataURL('image/jpeg', 0.95));
  
  // 4. Escala de cinza + sharpening
  const sharpCanvas = document.createElement('canvas');
  sharpCanvas.width = width;
  sharpCanvas.height = height;
  const sharpCtx = sharpCanvas.getContext('2d')!;
  sharpCtx.drawImage(img, 0, 0);
  toGrayscale(sharpCtx, width, height);
  sharpenImage(sharpCtx, width, height);
  increaseContrast(sharpCtx, width, height, 1.5);
  processedImages.push(sharpCanvas.toDataURL('image/jpeg', 0.95));
  
  // 5. Binarização com threshold alto
  const threshHighCanvas = document.createElement('canvas');
  threshHighCanvas.width = width;
  threshHighCanvas.height = height;
  const threshHighCtx = threshHighCanvas.getContext('2d')!;
  threshHighCtx.drawImage(img, 0, 0);
  toGrayscale(threshHighCtx, width, height);
  applyThreshold(threshHighCtx, width, height, 140);
  processedImages.push(threshHighCanvas.toDataURL('image/jpeg', 0.95));
  
  // 6. Binarização com threshold baixo
  const threshLowCanvas = document.createElement('canvas');
  threshLowCanvas.width = width;
  threshLowCanvas.height = height;
  const threshLowCtx = threshLowCanvas.getContext('2d')!;
  threshLowCtx.drawImage(img, 0, 0);
  toGrayscale(threshLowCtx, width, height);
  applyThreshold(threshLowCtx, width, height, 100);
  processedImages.push(threshLowCanvas.toDataURL('image/jpeg', 0.95));
  
  // 7. Brilho aumentado + contraste
  const brightCanvas = document.createElement('canvas');
  brightCanvas.width = width;
  brightCanvas.height = height;
  const brightCtx = brightCanvas.getContext('2d')!;
  brightCtx.drawImage(img, 0, 0);
  toGrayscale(brightCtx, width, height);
  adjustBrightness(brightCtx, width, height, 30);
  increaseContrast(brightCtx, width, height, 1.6);
  processedImages.push(brightCanvas.toDataURL('image/jpeg', 0.95));
  
  return processedImages;
};

/**
 * Redimensiona imagem mantendo proporção
 */
export const resizeImage = async (base64Image: string, maxWidth: number = 1280, maxHeight: number = 720): Promise<string> => {
  const img = await loadImageFromBase64(base64Image);
  
  let { width, height } = img;
  
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.95);
};
