"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { brand } from "@/config/brand";

type Status = "starting" | "scanning" | "found" | "nocamera" | "insecure" | "wrong" | "reading" | "notfound";

/**
 * Returns the /q/<token> path inside a QR text, or null if it isn't one of our login cards.
 * Only the path is used, always on this site: we never follow a link to another site, and a card
 * printed with an older address (e.g. localhost vs the computer's IP) still works.
 */
function cardPath(text: string): string | null {
  try {
    const { pathname } = new URL(text);
    return /^\/q\/[A-Za-z0-9_-]{20,}$/.test(pathname) ? pathname : null;
  } catch {
    return null;
  }
}

/** Reads a QR code from a photo. Large phone photos are scaled down first (faster, and jsQR copes better). */
async function readQrFromPhoto(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  for (const max of [1200, 800, 1800]) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;
  }
  return null;
}

/**
 * Reads a login-card QR code. Live camera where the browser allows it (https or localhost);
 * otherwise a "take a photo" button, which opens the camera app and works on plain http too.
 */
export function QrScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("starting");

  const follow = (text: string) => {
    const path = cardPath(text);
    if (!path) return false;
    setStatus("found");
    window.location.href = path;
    return true;
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const v = video.current, c = canvas.current;
      if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const code = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
          if (code?.data) {
            const path = cardPath(code.data);
            if (path) {
              setStatus("found");
              window.location.href = path;
              return;
            }
            setStatus("wrong");
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        // Browsers only allow the live camera on https (or localhost).
        if (!window.isSecureContext) {
          setStatus("insecure");
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera API");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setStatus("scanning");
        raf = requestAnimationFrame(tick);
      } catch {
        setStatus("nocamera");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow the same photo to be picked again
    if (!file) return;
    setStatus("reading");
    try {
      const text = await readQrFromPhoto(file);
      if (!text) return setStatus("notfound");
      if (!follow(text)) setStatus("wrong");
    } catch {
      setStatus("notfound");
    }
  };

  const liveCamera = status === "starting" || status === "scanning";

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-ink">
        <video ref={video} playsInline muted className="size-full object-cover" aria-label="Camera view" />
        <div aria-hidden className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-dashed border-sun" />
        {!liveCamera && <span aria-hidden className="absolute inset-0 grid place-items-center text-7xl">📇</span>}
        <canvas ref={canvas} className="hidden" />
      </div>
      <p role="status" aria-live="polite" className="text-center font-bold">
        {status === "starting" && "Starting the camera…"}
        {status === "scanning" && "Looking for your card…"}
        {status === "found" && "Found it! Opening your adventures…"}
        {status === "reading" && "Reading your card…"}
        {status === "wrong" && `That isn't a ${brand.name} login card. Try your card!`}
        {status === "notfound" && "We couldn't see the code. Take the photo closer, with the whole card in view."}
        {(status === "nocamera" || status === "insecure") && "Tap the button and take a photo of your card."}
      </p>

      {/* Photo fallback: opens the device camera app. Works on http, where the live camera is blocked. */}
      <label className="btn-pop mx-auto flex w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-2xl bg-sun px-5 py-4 text-lg font-bold text-ink">
        📸 Take a photo of my card
        <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="sr-only" data-testid="qr-photo" />
      </label>
    </div>
  );
}
