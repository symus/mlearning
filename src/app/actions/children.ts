"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ageBandForBirthYear } from "@/lib/age";
import { getOwnedChild, getSession, requireParent } from "@/lib/auth/dal";
import { verifySecret } from "@/lib/auth/password";
import { PLAN_CHILD_LIMIT } from "@/lib/pricing";
import { AVATAR_CHARACTERS, AVATAR_COLOURS, avatarSchema, childPrefsSchema, childSchema, fieldErrors, pinSchema, type FormState } from "@/lib/validation";

function parseChildForm(formData: FormData) {
  return childSchema.safeParse({
    nickname: formData.get("nickname"),
    birthYear: formData.get("birthYear"),
    dailyGoalMinutes: formData.get("dailyGoalMinutes"),
    interests: formData.getAll("interests"),
    narration: formData.get("narration") === "on",
    soundEffects: formData.get("soundEffects") === "on",
    textSize: formData.get("textSize") ?? "normal",
    dailyLimitMinutes: formData.get("dailyLimitMinutes") ?? "",
  });
}

function childValues(formData: FormData) {
  return {
    nickname: String(formData.get("nickname") ?? ""),
    birthYear: String(formData.get("birthYear") ?? ""),
    dailyGoalMinutes: String(formData.get("dailyGoalMinutes") ?? "15"),
    interests: formData.getAll("interests").map(String).join(","),
    narration: formData.get("narration") === "on" ? "on" : "",
    soundEffects: formData.get("soundEffects") === "on" ? "on" : "",
    textSize: String(formData.get("textSize") ?? "normal"),
    dailyLimitMinutes: String(formData.get("dailyLimitMinutes") ?? ""),
  };
}

export async function createChild(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireParent();
  const parsed = parseChildForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: childValues(formData) };

  const [count, sub] = await Promise.all([
    db.childProfile.count({ where: { parentId: session.userId } }),
    db.subscription.findUnique({ where: { userId: session.userId } }),
  ]);
  const limit = PLAN_CHILD_LIMIT[sub?.plan ?? "FREE"];
  if (count >= limit) {
    return { message: `Your plan includes ${limit} child profile${limit > 1 ? "s" : ""}. The Family plan supports up to 4.`, values: childValues(formData) };
  }

  const d = parsed.data;
  const child = await db.childProfile.create({
    data: {
      parentId: session.userId,
      nickname: d.nickname,
      birthYear: d.birthYear,
      ageBand: ageBandForBirthYear(d.birthYear),
      dailyGoalMinutes: d.dailyGoalMinutes,
      interests: d.interests,
      narration: d.narration,
      soundEffects: d.soundEffects,
      textSize: d.textSize,
      dailyLimitMinutes: d.dailyLimitMinutes,
      avatar: { character: AVATAR_CHARACTERS[count % AVATAR_CHARACTERS.length], colour: AVATAR_COLOURS[count % AVATAR_COLOURS.length] },
    },
  });
  await db.auditLog.create({ data: { userId: session.userId, action: "child.created", targetId: child.id } });
  revalidatePath("/parent");
  redirect(`/parent/children/${child.id}?created=1`);
}

export async function updateChild(childId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return { message: "Profile not found." };
  const parsed = parseChildForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: childValues(formData) };
  const d = parsed.data;
  await db.childProfile.update({
    where: { id: child.id },
    data: { nickname: d.nickname, birthYear: d.birthYear, ageBand: ageBandForBirthYear(d.birthYear), dailyGoalMinutes: d.dailyGoalMinutes, interests: d.interests, narration: d.narration, soundEffects: d.soundEffects, textSize: d.textSize, dailyLimitMinutes: d.dailyLimitMinutes },
  });
  revalidatePath(`/parent/children/${child.id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteChild(childId: string, formData: FormData): Promise<void> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) redirect("/parent");
  if (String(formData.get("confirm") ?? "").trim() !== child.nickname) redirect(`/parent/children/${child.id}?deleteError=1`);
  // Cascades remove attempts, mastery and achievements (right to erasure).
  await db.childProfile.delete({ where: { id: child.id } });
  await db.auditLog.create({ data: { userId: session.userId, action: "child.deleted", targetId: child.id } });
  revalidatePath("/parent");
  redirect("/parent?deleted=1");
}

/** Parent hands the device to a child: enter child mode for that profile. */
export async function startPlaying(childId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.childOnly) redirect("/play"); // a card session can't switch to a sibling
  const child = await getOwnedChild(session.userId, childId);
  if (!child) redirect("/play/who");
  await db.session.update({ where: { id: session.id }, data: { activeChildId: child.id, childMode: true } });
  redirect(child.onboardedAt ? "/play" : "/play/onboarding");
}

/** Leave child mode. Requires the parent PIN so children can't reach settings or billing. */
export async function exitChildMode(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.childOnly) return { message: "This device signed in with a child's card. A grown-up needs to log in with their email and password." };
  const parsed = pinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { parentPinHash: true } });
  if (!(await verifySecret(parsed.data.pin, user?.parentPinHash))) return { message: "That PIN isn't right. Ask a grown-up for help." };
  await db.session.update({ where: { id: session.id }, data: { childMode: false, activeChildId: null } });
  redirect("/parent");
}

export async function saveOnboarding(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.activeChild) redirect("/play/who");
  const avatar = avatarSchema.safeParse({ character: formData.get("character"), colour: formData.get("colour") });
  await db.childProfile.update({
    where: { id: session.activeChild.id },
    data: { avatar: avatar.success ? avatar.data : { character: "fox", colour: "sun" }, onboardedAt: new Date() },
  });
  redirect("/play?welcome=1");
}

/** Child-side accessibility settings (text size, sounds, read-aloud). The daily limit stays parent-only. */
export async function updateMyPrefs(prefs: { soundEffects: boolean; narration: boolean; textSize: string }): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session?.activeChild) return { ok: false };
  const parsed = childPrefsSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false };
  await db.childProfile.update({ where: { id: session.activeChild.id }, data: parsed.data });
  revalidatePath("/play", "layout");
  return { ok: true };
}
