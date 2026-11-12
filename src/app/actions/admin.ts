"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";

const NEXT_STATUS = { publish: "PUBLISHED", draft: "DRAFT", review: "IN_REVIEW", archive: "ARCHIVED" } as const;

export async function setActivityStatus(activityId: string, decision: keyof typeof NEXT_STATUS): Promise<void> {
  const session = await requireRole(["ADMIN", "REVIEWER"]);
  const status = NEXT_STATUS[decision];
  await db.activity.update({
    where: { id: activityId },
    data: { status, ...(status === "PUBLISHED" ? { reviewedById: session.userId, reviewedAt: new Date() } : {}) },
  });
  await db.auditLog.create({ data: { userId: session.userId, action: `content.${decision}`, targetId: activityId } });
  revalidatePath("/admin");
  revalidatePath(`/admin/activity/${activityId}`);
}
