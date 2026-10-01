import { describe, expect, it } from "vitest";

import { DEMO_ERROR, demoImportAllowed, isDemoEmail } from "@/lib/demo";

describe("isDemoEmail", () => {
  it("matches the same address", () => {
    expect(isDemoEmail("demo@rytm.local", "demo@rytm.local")).toBe(true);
  });

  it("ignores case", () => {
    expect(isDemoEmail("Demo@Rytm.LOCAL", "demo@rytm.local")).toBe(true);
  });

  it("ignores surrounding whitespace on either side", () => {
    expect(isDemoEmail("  demo@rytm.local ", " demo@rytm.local\n")).toBe(true);
  });

  it("rejects a different address", () => {
    expect(isDemoEmail("test@rytm.local", "demo@rytm.local")).toBe(false);
  });

  it("is false when the demo address is unset or empty", () => {
    expect(isDemoEmail("demo@rytm.local", undefined)).toBe(false);
    expect(isDemoEmail("demo@rytm.local", "")).toBe(false);
    expect(isDemoEmail("demo@rytm.local", "   ")).toBe(false);
  });

  it("is false when the user has no address", () => {
    expect(isDemoEmail(undefined, "demo@rytm.local")).toBe(false);
    expect(isDemoEmail(null, "demo@rytm.local")).toBe(false);
    expect(isDemoEmail("", "demo@rytm.local")).toBe(false);
  });

  it("is false when both are empty", () => {
    expect(isDemoEmail("", "")).toBe(false);
    expect(isDemoEmail(undefined, undefined)).toBe(false);
  });
});

describe("demoImportAllowed", () => {
  it("allows the first import into an empty account", () => {
    expect(demoImportAllowed(0)).toBe(true);
  });

  it("refuses once the account has imports", () => {
    expect(demoImportAllowed(1)).toBe(false);
    expect(demoImportAllowed(3)).toBe(false);
  });
});

describe("DEMO_ERROR", () => {
  it("points each refusal at its form's error slot", () => {
    expect(DEMO_ERROR).toEqual({
      password: "/settings?error=demo-password",
      delete: "/settings?error=demo-delete",
      undo: "/imports?error=demo",
      import: "/imports/new?error=demo",
    });
  });
});
