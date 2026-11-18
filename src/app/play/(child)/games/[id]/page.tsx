import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { MemoryBoard } from "@/components/games/memory-board";

export const metadata = { title: "Memory" };

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { child } = await requireChild();
  const { id } = await params;
  // Only the two players can open a game.
  const game = await db.memoryGame.findFirst({ where: { id, OR: [{ playerAId: child.id }, { playerBId: child.id }] }, select: { playerAId: true, playerBId: true } });
  if (!game) notFound();
  return (
    <div className="space-y-4">
      <Link href="/play/games" className="text-sm font-bold text-white/80 hover:text-white">← Games</Link>
      <MemoryBoard gameId={id} opponentId={game.playerAId === child.id ? game.playerBId : game.playerAId} />
    </div>
  );
}
