import { requireChild } from "@/lib/auth/dal";
import { GamesLobby } from "@/components/games/games-lobby";

export const metadata = { title: "Games" };

export default async function GamesPage() {
  await requireChild();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">🎮 Memory with a classmate</h1>
        <p className="text-white/80">Take turns to flip two cards. Find a pair and you go again. Just for fun!</p>
      </header>
      <GamesLobby />
    </div>
  );
}
