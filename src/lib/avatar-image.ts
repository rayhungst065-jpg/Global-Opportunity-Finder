export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 8 * 1024 * 1024;
export const AVATAR_EDGE = 400;

export function validateAvatar(file: Pick<File, "type" | "size">) {
  if (!AVATAR_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > AVATAR_MAX_BYTES) return "That image is larger than 8 MB. Please choose a smaller one.";
  return null;
}

/** Center-crop any aspect ratio without upscaling smaller photos. */
export function avatarCrop(width: number, height: number) {
  const side = Math.min(width, height);
  if (!Number.isFinite(side) || side <= 0) throw new Error("Couldn't read that image. Please choose another JPG, PNG or WebP.");
  return { x: (width - side) / 2, y: (height - side) / 2, side, edge: Math.min(side, AVATAR_EDGE) };
}

/** Browser-only processing; only the optimized image is uploaded. */
export async function optimizeAvatar(file: File): Promise<Blob> {
  const bad = validateAvatar(file);
  if (bad) throw new Error(bad);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const crop = avatarCrop(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = crop.edge;
    canvas.height = crop.edge;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable. Please try another browser.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, crop.edge, crop.edge);
    const result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
    if (!result || !AVATAR_TYPES.includes(result.type) || result.size > AVATAR_MAX_BYTES) {
      throw new Error("Couldn't optimize that image. Please try another photo.");
    }
    return result;
  } catch (error) {
    if (error instanceof Error && error.name !== "EncodingError") throw error;
    throw new Error("Couldn't read that image. Please choose another JPG, PNG or WebP.");
  } finally {
    URL.revokeObjectURL(url);
  }
}