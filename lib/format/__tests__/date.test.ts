import { describe, expect, it } from "vitest";
import { isFutureDisplayDateTime } from "../date";

describe("isFutureDisplayDateTime", () => {
  it("rejects a later time on the current date", () => {
    const now = new Date("2026-09-11T16:51:00+08:00");

    expect(isFutureDisplayDateTime("11/09/2026", "17:00", now)).toBe(true);
    expect(isFutureDisplayDateTime("11/09/2026", "16:30", now)).toBe(false);
  });
});
