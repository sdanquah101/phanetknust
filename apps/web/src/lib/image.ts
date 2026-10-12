/** Widths Next.js's image optimiser accepts (its default device and image sizes). */
const WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/** Quality for photographs: higher than Next's default 75, which visibly softens faces. */
export const PHOTO_QUALITY = 88;

/**
 * URL of a local photo resized by the image optimiser to at least `width` pixels
 * (never larger than the original). Used where photos are drawn as CSS backgrounds.
 */
export function optimizedSrc(src: string, width: number) {
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${PHOTO_QUALITY}`;
}
