import type { Item } from "./schema";

export type Answer = string | number | string[];

export interface CheckResult {
  correct: boolean;
  misconception?: string;
}

/** Pure answer checking. Runs on the server so answers are never trusted from the client. */
export function checkAnswer(item: Item, answer: Answer): CheckResult {
  let correct = false;
  let key = Array.isArray(answer) ? answer.join(",") : String(answer);
  if (item.type === "choice") correct = answer === item.answer;
  else if (item.type === "number") {
    // Accept "0,5" (comma decimals are common in Poland/Europe) as well as "0.5".
    const n = typeof answer === "number" ? answer : Number(String(answer).trim().replace(",", "."));
    correct = Number.isFinite(n) && Math.abs(n - item.answer) < 1e-9;
    if (Number.isFinite(n)) key = String(n);
  } else if (item.type === "order") {
    correct = Array.isArray(answer) && answer.length === item.answer.length && answer.every((id, i) => id === item.answer[i]);
  }
  if (correct) return { correct };
  return { correct, misconception: item.misconceptions?.[key] };
}

/** Item as sent to the browser: answer, explanation and misconception map removed. */
export function publicItem(item: Item) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { answer, explanation, misconceptions, ...rest } = item;
  return rest;
}
export type PublicItem = ReturnType<typeof publicItem>;
