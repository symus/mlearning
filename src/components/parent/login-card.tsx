"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { brand } from "@/config/brand";
import { cancelLoginCard, createLoginCard } from "@/app/actions/cards";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";

/**
 * Parent tool: make, print and cancel a child's QR login card.
 * The card's secret only lives on this screen; leaving the page means making a new card to reprint.
 */
export function LoginCardManager({ childId, nickname, avatar, activeSince }: { childId: string; nickname: string; avatar: unknown; activeSince: string | null }) {
  const [card, setCard] = useState<{ url: string; qr: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const make = () =>
    start(async () => {
      setError("");
      const res = await createLoginCard(childId);
      if ("error" in res) return setError(res.error);
      const qr = await QRCode.toDataURL(res.url, { margin: 1, width: 360, errorCorrectionLevel: "M" });
      setCard({ url: res.url, qr });
    });

  const cancel = () =>
    start(async () => {
      await cancelLoginCard(childId);
      setCard(null);
    });

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">
        Print a QR card so {nickname} can start learning by scanning it, with no email or password. The card opens <strong>only {nickname}&apos;s play area</strong>; your reports and settings still need your email and password.
      </p>
      {activeSince && !card && <p className="rounded-xl bg-leaf-soft px-4 py-2 text-sm font-semibold text-success">A card is active (made {activeSince}).</p>}
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}

      {card && (
        <>
          <CardFace card={card} nickname={nickname} avatar={avatar} />
          {/* Print copy directly under <body>, so printing shows only the card on one page. */}
          {createPortal(
            <div className="print-only hidden">
              <CardFace card={card} nickname={nickname} avatar={avatar} />
            </div>,
            document.body,
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {card ? (
          <Button type="button" onClick={() => window.print()}>🖨️ Print card</Button>
        ) : (
          <Button type="button" onClick={make} disabled={pending}>
            {pending ? "Making…" : activeSince ? "Make a new card (cancels the old one)" : "Make a login card"}
          </Button>
        )}
        {(activeSince || card) && (
          <Button type="button" variant="secondary" onClick={cancel} disabled={pending}>Cancel card</Button>
        )}
      </div>
      {card && <p className="text-xs text-ink-muted">This QR code is shown only now. To print it again later, make a new card (the old one will stop working).</p>}
    </div>
  );
}

function CardFace({ card, nickname, avatar }: { card: { url: string; qr: string }; nickname: string; avatar: unknown }) {
  return (
    <div className="mx-auto w-72 rounded-3xl border-4 border-brand bg-white p-5 text-center text-ink shadow-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.qr} alt={`Login QR code for ${nickname}`} data-login-url={card.url} className="mx-auto size-56" />
      <div className="mt-3 flex items-center justify-center gap-2">
        <Avatar avatar={avatar} size="sm" />
        <span className="font-display text-2xl font-bold">{nickname}</span>
      </div>
      <p className="mt-1 text-sm">Scan me to start learning!</p>
      <p className="mt-3 font-display text-lg font-bold text-brand">{brand.name}</p>
      <p className="mt-1 text-[10px] text-ink-muted">Keep this card safe. A grown-up can cancel it at any time.</p>
    </div>
  );
}
