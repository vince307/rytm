import { describe, expect, it } from "vitest";

import { copy } from "@/content/copy";
import { tableHeaders } from "@/lib/patterns/table-columns";

describe("tableHeaders", () => {
  it("maps the round-3 kit columns to the table's body order", () => {
    expect(tableHeaders(copy.patterns.columns)).toEqual([
      "Sprzedawca",
      "Typ",
      "Wystąpienia",
      "Suma",
      "Kwota",
      "Próg",
      "Ponad progiem",
    ]);
  });
});
