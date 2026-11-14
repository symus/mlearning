"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdult } from "@/lib/auth/dal";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";
import { changePinSchema, fieldErrors, type FormState } from "@/lib/validation";

export async function changePin(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdult();
  const parsed = changePinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!(await verifySecret(parsed.data.currentPassword, user.passwordHash))) return { errors: { currentPassword: ["Password is incorrect."] } };
  await db.user.update({ where: { id: user.id }, data: { parentPinHash: await hashSecret(parsed.data.pin) } });
  return { ok: true, message: "Parent PIN updated." };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdult();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (String(formData.get("confirm") ?? "") !== "DELETE") return { errors: { confirm: ['Type DELETE to confirm.'] } };
  if (!(await verifySecret(String(formData.get("password") ?? ""), user.passwordHash))) return { errors: { password: ["Password is incorrect."] } };
  await destroySession();
  // Cascade deletes children, learning records, sessions and consents.
  await db.user.delete({ where: { id: user.id } });
  redirect("/?accountDeleted=1");
}
