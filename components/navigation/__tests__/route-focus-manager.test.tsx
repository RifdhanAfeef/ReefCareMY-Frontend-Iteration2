import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouteFocusManager } from "../route-focus-manager";

let pathname = "/report-a-reef";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("RouteFocusManager", () => {
  beforeEach(() => {
    pathname = "/report-a-reef";
    vi.stubGlobal("scrollTo", vi.fn());
  });

  it("moves keyboard focus to the page heading after route navigation", () => {
    const { rerender } = render(
      <main>
        <RouteFocusManager />
        <h1>Report details</h1>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Report details" })).toHaveFocus();

    pathname = "/report-a-reef/location";
    rerender(
      <main>
        <RouteFocusManager />
        <h1>Observation location</h1>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Observation location" })).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });
});
