"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOwnedClass, requireTeacher } from "@/lib/auth/dal";
import { cardOrigin, issueCard, type IssuedCard } from "@/lib/auth/cards";
import { bandActivityWhere } from "@/lib/learning/reachable";
import { MAX_CLASSES, MAX_CLASS_SIZE } from "@/lib/pricing";
import { AGE_BANDS } from "@/lib/age";
import { assignmentSchema, classSchema, fieldErrors, studentNamesSchema, type FormState } from "@/lib/validation";

const classPath = (id: string) => `/teacher/classes/${id}`;

export async function createClass(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireTeacher();
  const parsed = classSchema.safeParse(Object.fromEntries(formData));
  const values = { name: String(formData.get("name") ?? ""), ageBand: String(formData.get("ageBand") ?? "") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if ((await db.classroom.count({ where: { teacherId: session.userId, archivedAt: null } })) >= MAX_CLASSES) {
    return { message: `You can have up to ${MAX_CLASSES} classes during the pilot.`, values };
  }
  const cls = await db.classroom.create({ data: { teacherId: session.userId, ...parsed.data } });
  await db.auditLog.create({ data: { userId: session.userId, action: "class.created", targetId: cls.id } });
  redirect(`${classPath(cls.id)}?new=1`);
}

/** Add students by first name. They get a default explorer and pick their own on first login. */
export async function addStudents(classId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireTeacher();
  const cls = await getOwnedClass(session.userId, classId);
  if (!cls) return { message: "Class not found." };
  const parsed = studentNamesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { names: String(formData.get("names") ?? "") } };
  const now = await db.childProfile.count({ where: { classroomId: cls.id } });
  if (now + parsed.data.names.length > MAX_CLASS_SIZE) {
    return { message: `A class can have up to ${MAX_CLASS_SIZE} students (it has ${now}).`, values: { names: String(formData.get("names") ?? "") } };
  }
  // Data minimisation: first name only; birth year is the class's typical age, not the child's real one.
  const band = AGE_BANDS[cls.ageBand];
  const birthYear = new Date().getFullYear() - Math.round((band.minAge + band.maxAge) / 2);
  await db.childProfile.createMany({
    data: parsed.data.names.map((nickname) => ({
      parentId: session.userId,
      classroomId: cls.id,
      nickname,
      birthYear,
      ageBand: cls.ageBand,
      avatar: { character: "fox", colour: "sun" },
    })),
  });
  await db.auditLog.create({ data: { userId: session.userId, action: "class.students_added", targetId: cls.id } });
  revalidatePath(classPath(cls.id));
  return { message: `Added ${parsed.data.names.length} student${parsed.data.names.length === 1 ? "" : "s"}.`, ok: true };
}

/** Permanently deletes a student's profile and learning records (they leave the class). */
export async function removeStudent(classId: string, studentId: string): Promise<void> {
  const session = await requireTeacher();
  const cls = await getOwnedClass(session.userId, classId);
  if (!cls) return;
  const { count } = await db.childProfile.deleteMany({ where: { id: studentId, classroomId: cls.id, parentId: session.userId } });
  if (count) await db.auditLog.create({ data: { userId: session.userId, action: "class.student_removed", targetId: cls.id } });
  revalidatePath(classPath(cls.id));
}

/** New login cards for some or all students (old cards stop working). The secrets go only to this screen. */
export async function makeClassCards(classId: string, studentIds?: string[]): Promise<{ cards: IssuedCard[] } | { error: string }> {
  const session = await requireTeacher();
  const cls = await getOwnedClass(session.userId, classId);
  if (!cls) return { error: "Class not found." };
  const students = await db.childProfile.findMany({
    where: { classroomId: cls.id, parentId: session.userId, ...(studentIds ? { id: { in: studentIds } } : {}) },
    orderBy: { nickname: "asc" },
  });
  const origin = await cardOrigin();
  const cards: IssuedCard[] = [];
  for (const s of students) cards.push(await issueCard(s, session.userId, origin)); // sequential: login IDs stay unique
  revalidatePath(classPath(cls.id));
  return { cards };
}

/** Set an activity for the whole class (setting it again just changes the due date). */
export async function setAssignment(classId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireTeacher();
  const cls = await getOwnedClass(session.userId, classId);
  if (!cls) return { message: "Class not found." };
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const activity = await db.activity.findFirst({ where: { AND: [await bandActivityWhere(cls.ageBand), { slug: parsed.data.activitySlug }] }, select: { id: true, title: true } });
  if (!activity) return { errors: { activitySlug: ["Choose an activity for this age group."] } };
  const dueAt = parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T23:59:59`) : null;
  await db.assignment.upsert({
    where: { classroomId_activityId: { classroomId: cls.id, activityId: activity.id } },
    create: { classroomId: cls.id, activityId: activity.id, dueAt },
    update: { dueAt },
  });
  await db.auditLog.create({ data: { userId: session.userId, action: "class.assignment_set", targetId: cls.id } });
  revalidatePath(classPath(cls.id));
  return { message: `Set “${activity.title}” for the class.`, ok: true };
}

export async function removeAssignment(classId: string, assignmentId: string): Promise<void> {
  const session = await requireTeacher();
  const cls = await getOwnedClass(session.userId, classId);
  if (!cls) return;
  await db.assignment.deleteMany({ where: { id: assignmentId, classroomId: cls.id } });
  revalidatePath(classPath(cls.id));
}
