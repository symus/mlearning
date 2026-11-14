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
export type PrintCard = { url: string; qr: string; loginId: string; password: string };

export function LoginCardManager({ childId, nickname, avatar, loginId, activeSince }: { childId: string; nickname: string; avatar: unknown; loginId: string | null; activeSince: string | null }) {
  const [card, setCard] = useState<PrintCard | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const make = () =>
    start(async () => {
      setError("");
      try {
        const res = await createLoginCard(childId);
        if ("error" in res) return setError(res.error);
        const qr = await QRCode.toDataURL(res.url, { margin: 1, width: 360, errorCorrectionLevel: "M" });
        setCard({ url: res.url, qr, loginId: res.loginId, password: res.password });
      } catch (e) {
        console.error("Making the login card failed", e);
        setError("Sorry, we couldn't make the card. Please try again. (If you run the app yourself: check the server terminal for the error.)");
      }
    });

  const cancel = () =>
    start(async () => {
      setError("");
      try {
        await cancelLoginCard(childId);
        setCard(null);
      } catch (e) {
        console.error("Cancelling the login card failed", e);
        setError("Sorry, we couldn't cancel the card. Please try again.");
      }
    });

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">
        Print a card so {nickname} can start learning by scanning its QR code, or by typing the login ID and password on it (on the login page, under “I’m a child”). The card opens <strong>only {nickname}&apos;s play area</strong>; your reports and settings still need your email and password.
      </p>
      {activeSince && !card && <p className="rounded-xl bg-leaf-soft px-4 py-2 text-sm font-semibold text-success">A card is active (made {activeSince}).{loginId && <> Login ID: <strong className="font-mono">{loginId}</strong></>}</p>}
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
      {card && <p className="text-xs text-ink-muted">The QR code and password are shown only now (we keep only a scrambled copy). To print them again later, make a new card: the login ID stays, the password changes and the old card stops working.</p>}
    </div>
  );
}

export function CardFace({ card, nickname, avatar }: { card: PrintCard; nickname: string; avatar: unknown }) {
  return (
    <div className="mx-auto w-72 rounded-3xl border-4 border-brand bg-white p-5 text-center text-ink shadow-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.qr} alt={`Login QR code for ${nickname}`} data-login-url={card.url} className="mx-auto size-56" />
      <div className="mt-3 flex items-center justify-center gap-2">
        <Avatar avatar={avatar} size="sm" />
        <span className="font-display text-2xl font-bold">{nickname}</span>
      </div>
      <p className="mt-1 text-sm">Scan me, or type:</p>
      <dl className="mx-auto mt-2 grid w-fit grid-cols-[auto_auto] gap-x-3 gap-y-1 rounded-2xl bg-brand-soft px-4 py-2 text-left">
        <dt className="text-sm font-bold text-ink-soft">Login ID</dt>
        <dd className="font-mono text-lg font-bold tracking-wide" data-testid="card-login-id">{card.loginId}</dd>
        <dt className="text-sm font-bold text-ink-soft">Password</dt>
        <dd className="font-mono text-lg font-bold tracking-wide" data-testid="card-password">{card.password}</dd>
      </dl>
      <p className="mt-3 font-display text-lg font-bold text-brand">{brand.name}</p>
      <p className="mt-1 text-[10px] text-ink-muted">Keep this card safe. A grown-up can cancel it at any time.</p>
    </div>
  );
}
