import Link from "next/link";
import { QrScanner } from "@/components/qr-scanner";

export const metadata = { title: "Scan my card" };

export default function ScanCardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Scan your login card</h1>
      <p className="mb-6 mt-1 text-ink-soft">Hold your card in front of the camera. You&apos;ll go straight to your adventures!</p>
      <QrScanner />
      <p className="mt-6 text-sm text-ink-muted">
        No camera here? Open your tablet&apos;s camera app and point it at the card instead. Grown-ups can{" "}
        <Link href="/login" className="font-bold text-brand underline">log in with email</Link>.
      </p>
    </>
  );
}
