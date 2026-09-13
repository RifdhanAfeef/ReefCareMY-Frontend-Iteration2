import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { submitReport } from "@/lib/api/reportsApi";
import { clearDraftPhotos, loadDraftPhotos } from "../draft-storage";
import { ReportReview } from "../report-review";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/reportsApi", () => ({ submitReport: vi.fn() }));
vi.mock("../draft-storage", () => ({ loadDraftPhotos: vi.fn(), clearDraftPhotos: vi.fn() }));
vi.mock("@/features/epic-04-location/location-flow", () => ({ ReviewLocationSummary: () => null }));
vi.mock("@/features/shared/mock-app-state", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/shared/mock-app-state")>();
  return { ...original, useMockAppState: () => {
    const [reportDraft, setReport] = useState<typeof original.initialReportDraft>({ ...original.initialReportDraft,
      threatCategoryCode: "ghost_gear", threatCategoryId: 1,
      observationDate: "01/01/2020", observationTime: "10:00", description: "Net on coral.",
    });
    const [locationDraft, setLocation] = useState<typeof original.initialLocationDraft>({ ...original.initialLocationDraft,
      confidence: "dive_site_only", selectedSessionId: "one",
      sessions: [{ id: "one", backendId: 1, namedDiveSiteId: 1, site: "Reef" }],
    });
    return { reportDraft, locationDraft, resetReportDraft: () => {
      setReport(original.initialReportDraft);
      setLocation(original.initialLocationDraft);
    } };
  } };
});

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
  vi.mocked(loadDraftPhotos).mockResolvedValue([{ id: "one", file: new File(["photo"], "reef.jpg") }]);
  vi.mocked(clearDraftPhotos).mockResolvedValue(undefined);
  vi.mocked(submitReport).mockResolvedValue({ reportReference: "RC-1", status: "received", submittedAt: "2026-09-11T10:00:00Z", generalLocation: "Reef" });
});

it("shows success rather than missing fields while navigation is pending after resetting drafts", async () => {
  render(<ReportReview />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit report" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Submit report" }));
  await waitFor(() => expect(push).toHaveBeenCalled());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Report submitted");
  expect(screen.queryByText("Observation summary")).not.toBeInTheDocument();
});

it("still navigates to confirmation when local photo cleanup fails after API success", async () => {
  vi.mocked(clearDraftPhotos).mockRejectedValue(new Error("Storage unavailable"));
  render(<ReportReview />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit report" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Submit report" }));
  await waitFor(() => expect(push).toHaveBeenCalled());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
