import { describe, expect, it } from "vitest";
import { checkAnswer, publicItem } from "@/lib/content/check";
import type { Item } from "@/lib/content/schema";

const numberItem: Item = { id: "n", type: "number", prompt: "8 + 5 = ?", hints: ["Make 10"], explanation: "8 + 2 + 3 = 13", answer: 13, misconceptions: { "12": "COUNT_ALL_SLIP" } };
const decimal: Item = { id: "d", type: "number", prompt: "7/10 as decimal", hints: ["tenths"], explanation: "0.7 is seven tenths", answer: 0.7, misconceptions: { "0.07": "PLACE" } };
const choice: Item = { id: "c", type: "choice", prompt: "Pick", hints: ["h"], explanation: "because it is", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], answer: "b", misconceptions: { a: "WRONG" } };
const order: Item = { id: "o", type: "order", prompt: "Order", hints: ["h"], explanation: "in order now", tiles: [{ id: "x", label: "1" }, { id: "y", label: "2" }], answer: ["x", "y"] };

describe("checkAnswer", () => {
  it("checks numbers, including comma decimals used in Europe", () => {
    expect(checkAnswer(numberItem, 13).correct).toBe(true);
    expect(checkAnswer(numberItem, " 13 ").correct).toBe(true);
    expect(checkAnswer(decimal, "0,7").correct).toBe(true);
    expect(checkAnswer(decimal, "0.70").correct).toBe(true);
  });

  it("maps wrong answers to misconceptions", () => {
    expect(checkAnswer(numberItem, "12")).toEqual({ correct: false, misconception: "COUNT_ALL_SLIP" });
    expect(checkAnswer(decimal, "0.070")).toEqual({ correct: false, misconception: "PLACE" });
    expect(checkAnswer(numberItem, "99")).toEqual({ correct: false, misconception: undefined });
  });

  it("checks choices and order", () => {
    expect(checkAnswer(choice, "b").correct).toBe(true);
    expect(checkAnswer(choice, "a")).toEqual({ correct: false, misconception: "WRONG" });
    expect(checkAnswer(order, ["x", "y"]).correct).toBe(true);
    expect(checkAnswer(order, ["y", "x"]).correct).toBe(false);
    expect(checkAnswer(order, ["x"]).correct).toBe(false);
  });

  it("never sends answers or explanations to the browser", () => {
    const pub = publicItem(choice) as Record<string, unknown>;
    expect(pub.answer).toBeUndefined();
    expect(pub.explanation).toBeUndefined();
    expect(pub.misconceptions).toBeUndefined();
    expect(pub.hints).toBeDefined();
  });
});
