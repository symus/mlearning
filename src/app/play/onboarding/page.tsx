import { requireChild } from "@/lib/auth/dal";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const { child } = await requireChild();
  return (
    <main className="bg-universe flex min-h-dvh items-center justify-center px-4 py-10 text-white">
      <OnboardingForm nickname={child.nickname} narration={child.narration} />
    </main>
  );
}
