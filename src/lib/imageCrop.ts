export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageFocus = {
  x: number;
  y: number;
};

export type ImageFocusVariant = "card" | "hero" | "ground";

export type ImageFocusFields = {
  imageFocus?: string | null;
  imageFocusHero?: string | null;
  imageFocusGround?: string | null;
};

/** Card keeps legacy `imageFocus`. Hero/ground fall back to it for old posts. */
export const resolveImageFocus = (
  fields: ImageFocusFields | null | undefined,
  variant: ImageFocusVariant = "card",
): string | null => {
  if (!fields) return null;
  if (variant === "hero") return fields.imageFocusHero?.trim() || fields.imageFocus?.trim() || null;
  if (variant === "ground") return fields.imageFocusGround?.trim() || fields.imageFocus?.trim() || null;
  return fields.imageFocus?.trim() || null;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Image load failed")));
    img.src = src;
  });

export const focusFromCrop = (crop: PixelCrop, imageWidth: number, imageHeight: number): string => {
  const x = (crop.x + crop.width / 2) / imageWidth;
  const y = (crop.y + crop.height / 2) / imageHeight;
  return `${x.toFixed(4)},${y.toFixed(4)}`;
};

export const parseImageFocus = (focus: string | null | undefined): ImageFocus | null => {
  if (!focus) return null;
  const parts = focus.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { x: parts[0], y: parts[1] };
};

export const focusToObjectPosition = (focus: string | null | undefined): string => {
  const parsed = parseImageFocus(focus);
  if (!parsed) return "center";
  return `${(parsed.x * 100).toFixed(1)}% ${(parsed.y * 100).toFixed(1)}%`;
};

export const getCroppedImageDataUrl = async (
  imageSrc: string,
  pixelCrop: PixelCrop,
  maxWidth = 1280,
  quality = 0.85,
): Promise<string> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const scale = pixelCrop.width > maxWidth ? maxWidth / pixelCrop.width : 1;
  canvas.width = Math.round(pixelCrop.width * scale);
  canvas.height = Math.round(pixelCrop.height * scale);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", quality);
};

/** Compress full image for Option A multi-focus storage (not a single aspect crop). */
export const getCompressedImageDataUrl = async (
  imageSrc: string,
  maxWidth = 1280,
  quality = 0.85,
): Promise<string> => {
  const image = await loadImage(imageSrc);
  return getCroppedImageDataUrl(
    imageSrc,
    { x: 0, y: 0, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height },
    maxWidth,
    quality,
  );
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File read failed"));
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

export const compressImageFile = async (file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> => {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = image.width > maxWidth ? maxWidth / image.width : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Compress failed"))), "image/jpeg", quality);
  });
};
