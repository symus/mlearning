import { ProsePage } from "@/components/prose-page";
import { brand } from "@/config/brand";

export const metadata = { title: "Child safety" };

export default function SafetyPage() {
  return (
    <ProsePage title="Child safety" updated="12 November 2026">
      <p>{brand.name} is built for children first. These rules are part of how the product works, not optional settings.</p>
      <h2>What children can never do</h2>
      <ul>
        <li>See advertisements of any kind.</li>
        <li>Send or receive messages, or see other children.</li>
        <li>Make purchases or see prices.</li>
        <li>Open settings, reports or billing without the parent PIN.</li>
      </ul>
      <h2>Healthy engagement</h2>
      <ul>
        <li>No streaks that punish a missed day, no loot boxes, no countdown timers, no artificial scarcity.</li>
        <li>Rewards recognise effort, persistence and understanding, not just speed.</li>
        <li>Gentle daily goals with natural stopping points. When the goal is reached, we suggest a break.</li>
        <li>No manipulative notifications. Children receive no notifications at all.</li>
      </ul>
      <h2>What we store about a child</h2>
      <p>A nickname chosen by the parent, a birth year (to choose the right age group), interests, avatar choices and learning records. We do not ask for a child&apos;s full name, photo, school, location or email.</p>
      <h2>Content you can trust</h2>
      <p>Every activity is written to a published content standard and reviewed for accuracy, age-appropriateness and accessibility before it is published.</p>
    </ProsePage>
  );
}
