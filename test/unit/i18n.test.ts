import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/lib/i18n";

describe("resolveLocale", () => {
  const cases: [string, string | undefined, string | null, string][] = [
    ["cookie en wins", "en", null, "en"],
    ["cookie pl beats an English header", "pl", "en-US", "pl"],
    ["invalid cookie falls back to the header", "xx", "en-US,en;q=0.9", "en"],
    ["higher q for pl wins", undefined, "pl,en;q=0.5", "pl"],
    ["wildcard is ignored", undefined, "*", "pl"],
    ["both absent gives pl", undefined, null, "pl"],
    ["skips unsupported languages", undefined, "de-DE,en;q=0.8", "en"],
    ["q=0 is excluded", undefined, "en;q=0,pl;q=0.5", "pl"],
  ];
  it.each(cases)("%s", (_name, cookie, header, expected) => {
    expect(resolveLocale(cookie, header)).toBe(expected);
  });
});
