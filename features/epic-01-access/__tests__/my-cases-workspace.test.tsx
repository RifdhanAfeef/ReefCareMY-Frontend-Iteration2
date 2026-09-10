import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as coordinatorApi from "@/lib/api/coordinatorApi";
import type { CoordinatorQueueResult } from "@/lib/api/types";
import { MyCasesWorkspace } from "../my-cases-workspace";

vi.mock("@/lib/api/coordinatorApi");
const mockedGetCoordinatorQueue = vi.mocked(coordinatorApi.getCoordinatorQueue);

const owner = { id: 8, displayName: "Current Coordinator" };
const report: CoordinatorQueueResult["items"][number] = {
  reportReference: "RC-3001",
  threat: "Marine debris",
  area: "Redang Island",
  statusCode: "claimed",
  statusLabel: "Claimed",
  submittedAt: "2026-09-03T05:00:00Z",
  hoursInQueue: 1,
  claimedAt: "2026-09-04T01:00:00Z",
  owner,
};

function signIn() {
  window.localStorage.setItem("reefcare.auth", JSON.stringify({
    accessToken: "coordinator-token",
    user: { ...owner, role: "case_coordinator" },
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  mockedGetCoordinatorQueue.mockReset();
  signIn();
});

describe("Coordinator My Cases workspace", () => {
  it("derives owned cases from every queue page so claims work across devices", async () => {
    mockedGetCoordinatorQueue
      .mockResolvedValueOnce({
        items: [{ ...report, owner: { id: 9, displayName: "Another Coordinator" } }],
        page: 1,
        pageSize: 1,
        total: 2,
      })
      .mockResolvedValueOnce({
        items: [report],
        page: 2,
        pageSize: 1,
        total: 2,
      });

    render(<MyCasesWorkspace />);

    expect(await screen.findByRole("cell", { name: "RC-3001" })).toBeInTheDocument();
    expect(screen.getByText("Marine debris")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open case RC-3001" })).toHaveAttribute(
      "href",
      "/coordinator/reports/RC-3001",
    );
    expect(mockedGetCoordinatorQueue).toHaveBeenNthCalledWith(1, 1, 100);
    expect(mockedGetCoordinatorQueue).toHaveBeenNthCalledWith(2, 2, 1);
    expect(screen.queryByText("Another Coordinator")).not.toBeInTheDocument();
  });

  it("shows an error when the shared queue cannot be loaded", async () => {
    mockedGetCoordinatorQueue.mockRejectedValue(new Error("Service unavailable."));

    render(<MyCasesWorkspace />);

    expect(await screen.findByText("Your cases are unavailable")).toBeInTheDocument();
  });

  it("shows the empty state when the queue has no cases owned by this coordinator", async () => {
    mockedGetCoordinatorQueue.mockResolvedValue({
      items: [{ ...report, owner: { id: 9, displayName: "Another Coordinator" } }],
      page: 1,
      pageSize: 100,
      total: 1,
    });

    render(<MyCasesWorkspace />);

    expect(await screen.findByText("You have no claimed cases")).toBeInTheDocument();
    expect(screen.queryByText("Backend-verified cases")).not.toBeInTheDocument();
  });
});
