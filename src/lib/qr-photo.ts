/**
 * Reads a QR code from a photo (browser only). Real phone photos are hard: very large, tilted,
 * glare, or striped when the card is photographed on a screen. So we use ZXing (WebAssembly,
 * served from our own /zxing folder, never a CDN) and fall back to jsQR at a few sizes.
 */
import jsQR from "jsqr";

const MAX_SIDE = 2000; // big enough for a small QR in a 12 MP photo, small enough to be quick

/** Opens any photo the browser can show (createImageBitmap first, then an <img>, e.g. older Safari). */
async function loadImage(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function pixels(src: CanvasImageSource & { width: number; height: number }, maxSide: number): ImageData | null {
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale)), h = Math.max(1, Math.round(src.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

let zxingReady: Promise<typeof import("zxing-wasm/reader")> | null = null;
function zxing() {
  zxingReady ??= import("zxing-wasm/reader").then((m) => {
    m.prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? `/zxing/${path}` : prefix + path) } });
    return m;
  });
  return zxingReady;
}

/** The text inside the first QR code in the photo, or null if none could be read. */
export async function readQrFromPhoto(file: Blob): Promise<string | null> {
  const image = await loadImage(file);
  const full = pixels(image, MAX_SIDE);
  if (!full) return null;

  try {
    const { readBarcodes } = await zxing();
    const [hit] = await readBarcodes(full, { formats: ["QRCode"], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 1 });
    if (hit?.isValid && hit.text) return hit.text;
  } catch (e) {
    console.warn("ZXing QR reader unavailable, using jsQR", e);
  }

  for (const side of [1200, 800, MAX_SIDE]) {
    const img = side === MAX_SIDE ? full : pixels(image, side);
    if (!img) continue;
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;
  }
  return null;
}
