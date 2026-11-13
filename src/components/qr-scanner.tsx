"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { brand } from "@/config/brand";

/** Reads a login-card QR code with the device camera (works in all modern browsers via jsQR). */
export function QrScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "found" | "nocamera" | "wrong">("starting");

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
            try {
              const url = new URL(code.data);
              // Only follow our own login-card links.
              if (url.origin === window.location.origin && url.pathname.startsWith("/q/")) {
                setStatus("found");
                window.location.href = url.pathname;
                return;
              }
            } catch {
              /* not a URL */
            }
            setStatus("wrong");
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
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

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-ink">
        <video ref={video} playsInline muted className="size-full object-cover" aria-label="Camera view" />
        <div aria-hidden className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-dashed border-sun" />
        <canvas ref={canvas} className="hidden" />
      </div>
      <p role="status" aria-live="polite" className="text-center font-bold">
        {status === "starting" && "Starting the camera…"}
        {status === "scanning" && "Looking for your card…"}
        {status === "found" && "Found it! Opening your adventures…"}
        {status === "wrong" && `That isn't a ${brand.name} login card. Try your card!`}
        {status === "nocamera" && "We can't use the camera here. Allow camera access, or use your tablet's camera app."}
      </p>
    </div>
  );
}
