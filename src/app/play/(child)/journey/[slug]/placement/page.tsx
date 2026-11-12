import { notFound } from "next/navigation";
import { requireChild } from "@/lib/auth/dal";
import { getJourney } from "@/lib/learning/journey";
import { publicItem } from "@/lib/content/check";
import { PlacementQuiz } from "@/components/child/placement-quiz";

export const metadata = { title: "Find my level" };

export default async function PlacementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { child } = await requireChild();
  const journey = await getJourney(slug);
  if (!journey || !journey.ageBands.includes(child.ageBand)) notFound();
  // Answers stay on the server; the quiz gets public items only.
  const tiers = journey.placement.tiers.map((t) => t.items.map(publicItem));
  const titles = journey.stages.flatMap((s) => s.lessons);
  return <PlacementQuiz slug={slug} tiers={tiers} lessonCount={titles.length} narration={child.narration} young={child.ageBand === "LITTLE_EXPLORERS"} />;
}
