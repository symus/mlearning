"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full border-2 border-line bg-surface px-4 py-2 text-sm font-bold hover:border-brand print:hidden">
      🖨️ Print / save as PDF
    </button>
  );
}
