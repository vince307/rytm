import { describe, expect, it } from "vitest";

import { onPersistedPageShow } from "@/components/hooks/usePageShowReset";

function pageShowEvent(persisted: boolean): Event {
  return Object.assign(new Event("pageshow"), { persisted });
}

describe("onPersistedPageShow", () => {
  it("calls the callback once on a persisted pageshow", () => {
    const target = new EventTarget();
    let calls = 0;
    onPersistedPageShow(target, () => {
      calls += 1;
    });

    target.dispatchEvent(pageShowEvent(true));

    expect(calls).toBe(1);
  });

  it("does not call the callback on a non-persisted pageshow", () => {
    const target = new EventTarget();
    let calls = 0;
    onPersistedPageShow(target, () => {
      calls += 1;
    });

    target.dispatchEvent(pageShowEvent(false));

    expect(calls).toBe(0);
  });

  it("stops listening after cleanup", () => {
    const target = new EventTarget();
    let calls = 0;
    const cleanup = onPersistedPageShow(target, () => {
      calls += 1;
    });

    cleanup();
    target.dispatchEvent(pageShowEvent(true));

    expect(calls).toBe(0);
  });
});
