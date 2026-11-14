"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { makeClassCards } from "@/app/actions/teacher";
import { CardFace, type PrintCard } from "@/components/parent/login-card";
import { Button } from "@/components/ui/button";

type Sheet = (PrintCard & { childId: string; nickname: string; avatar: unknown })[];

/** Make (or remake) login cards for the whole class and print them, several per page. */
export function ClassCards({ classId, studentCount }: { classId: string; studentCount: number }) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const make = () => {
    if (!window.confirm("Make new login cards for every student? Their old cards (QR codes and passwords) will stop working.")) return;
    start(async () => {
      setError("");
      try {
        const res = await makeClassCards(classId);
        if ("error" in res) return setError(res.error);
        setSheet(await Promise.all(res.cards.map(async (c) => ({ ...c, qr: await QRCode.toDataURL(c.url, { margin: 1, width: 360, errorCorrectionLevel: "M" }) }))));
      } catch (e) {
        console.error("Making class cards failed", e);
        setError("Sorry, we couldn't make the cards. Please try again.");
      }
    });
  };

  const grid = (cards: Sheet) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
      {cards.map((c) => (
        <div key={c.childId} className="break-inside-avoid">
          <CardFace card={c} nickname={c.nickname} avatar={c.avatar} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={make} disabled={pending || studentCount === 0}>
          {pending ? "Making cards…" : sheet ? "Make new cards again" : "📇 Make login cards for the class"}
        </Button>
        {sheet && <Button type="button" variant="secondary" onClick={() => window.print()}>🖨️ Print all cards</Button>}
      </div>
      {sheet && (
        <>
          <p className="text-sm text-ink-muted">These QR codes and passwords are shown only now. Print them before leaving this page. Login IDs never change.</p>
          {grid(sheet)}
          {createPortal(<div className="print-only hidden">{grid(sheet)}</div>, document.body)}
        </>
      )}
    </div>
  );
}
