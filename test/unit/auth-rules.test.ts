import { describe, expect, it } from "vitest";
import { DELETE_CONFIRM_WORDS, isDeleteConfirmWord } from "@/lib/auth-rules";

describe("isDeleteConfirmWord", () => {
  it("accepts either locale's word, exactly", () => {
    expect(isDeleteConfirmWord("USUŃ")).toBe(true);
    expect(isDeleteConfirmWord("DELETE")).toBe(true);
  });

  it("rejects lowercase and empty input", () => {
    expect(isDeleteConfirmWord("usuń")).toBe(false);
    expect(isDeleteConfirmWord("delete")).toBe(false);
    expect(isDeleteConfirmWord("")).toBe(false);
  });

  it("keeps one word per locale", () => {
    expect(DELETE_CONFIRM_WORDS).toEqual({ pl: "USUŃ", en: "DELETE" });
  });
});
