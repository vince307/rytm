import { describe, expect, it } from "vitest";

import { deleteImportRedirect, deleteImportSchema } from "@/lib/import/delete";

describe("deleteImportSchema", () => {
  it("accepts a v4 uuid", () => {
    expect(deleteImportSchema.safeParse({ id: "a0000000-0000-4000-8000-000000000001" }).success).toBe(true);
  });

  it("rejects a malformed, empty or missing id", () => {
    expect(deleteImportSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(deleteImportSchema.safeParse({ id: "" }).success).toBe(false);
    expect(deleteImportSchema.safeParse({}).success).toBe(false);
  });
});

describe("deleteImportRedirect", () => {
  it("redirects to the delete error when the database reports an error, even with rows returned", () => {
    expect(
      deleteImportRedirect({ data: [{ id: "a0000000-0000-4000-8000-000000000001" }], error: { message: "boom" } }),
    ).toBe("/imports?error=delete");
  });

  it("redirects to missing when the RLS-filtered delete returns no row", () => {
    expect(deleteImportRedirect({ data: [], error: null })).toBe("/imports?error=missing");
  });

  it("redirects to missing when data is null", () => {
    expect(deleteImportRedirect({ data: null, error: null })).toBe("/imports?error=missing");
  });

  it("redirects to deleted=1 when exactly one row is returned", () => {
    expect(deleteImportRedirect({ data: [{ id: "a0000000-0000-4000-8000-000000000001" }], error: null })).toBe(
      "/imports?deleted=1",
    );
  });
});
