import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAutomaticPhotoDraftChanges, ObservationForm } from "../observation-form";
import { structureReportDescription } from "@/lib/api/smartReportApi";
import { getThreatCategories } from "@/lib/api/referenceApi";
import { loadDraftPhotos } from "@/features/epic-02-reporting/draft-storage";

const { updateReportDraft, runtime } = vi.hoisted(() => ({
  updateReportDraft: vi.fn(),
  runtime: { draftRestored: undefined as boolean | undefined },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/shared/mock-app-state", () => ({
  useMockAppState: () => ({
    reportDraft: {
      threatCategoryCode: "",
      threatCategoryId: null,
      observationDate: "",
      observationTime: "",
      estimatedDepthMetres: "",
      description: "A large fishing net is tangled around coral at about 12 metres.",
      photos: [],
      aiSuggestions: [],
      lastSavedAt: null,
    },
    isAccountDraftRestored: runtime.draftRestored,
    locationDraft: {
      sessions: [],
      selectedSessionId: "",
      locationSource: "dive_site",
      confidence: "",
      pin: null,
    },
    updateReportDraft,
    saveReportDraft: vi.fn(),
  }),
}));

vi.mock("@/features/epic-02-reporting/draft-storage", () => ({
  createPhotoId: vi.fn(),
  loadDraftPhotos: vi.fn().mockResolvedValue([]),
  saveDraftPhotos: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api/referenceApi", () => ({
  getThreatCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api/reportsApi", () => ({
  checkReportCompleteness: vi.fn(),
}));

vi.mock("@/lib/api/smartReportApi", () => ({
  structureReportDescription: vi.fn(),
}));

describe("automatic Smart Report Structuring", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runtime.draftRestored = undefined;
    vi.setSystemTime(new Date("2026-09-16T00:00:00Z"));
    vi.clearAllMocks();
    vi.mocked(structureReportDescription).mockResolvedValue({
      available: true,
      suggestions: [{ field: "estimated_depth", label: "Estimated depth", suggestedValue: "12m" }],
      missingFields: ["approximate size"],
      followUpQuestions: [],
      warnings: [],
      requiresUserConfirmation: true,
    });
  });

  afterEach(() => vi.useRealTimers());

  it("analyses the description after typing pauses without requiring a button", async () => {
    render(<ObservationForm />);

    expect(screen.getByRole("list", { name: "Report progress" })).toBeInTheDocument();
    expect(screen.getByText("Observation").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.queryByRole("button", { name: "Check my description" })).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(structureReportDescription).toHaveBeenCalledWith(
      "A large fishing net is tangled around coral at about 12 metres.",
    );
    expect(updateReportDraft).toHaveBeenCalledWith(expect.objectContaining({
      estimatedDepthMetres: "12",
      aiSuggestions: [expect.objectContaining({ field: "estimated_depth_metres", status: "unresolved", conflict: false })],
    }));
    expect(screen.getByText(/Consider adding: approximate size/i)).toBeInTheDocument();
  });

  it("loads photo file date and time immediately while preserving values already entered", () => {
    const file = new File(["reef"], "reef.jpg", {
      type: "image/jpeg",
      lastModified: Date.parse("2026-08-28T07:26:21Z"),
    });

    const automatic = buildAutomaticPhotoDraftChanges(
      [{ id: "photo-1", file }],
      [],
      "",
      "",
    );
    expect(automatic.changes).toEqual(expect.objectContaining({
      observationDate: "28/08/2026",
      observationTime: "15:26",
      photos: [expect.objectContaining({ capturedAtConfirmed: true })],
    }));

    const preserved = buildAutomaticPhotoDraftChanges(
      [{ id: "photo-1", file }],
      [],
      "27/08/2026",
      "14:10",
    );
    expect(preserved.changes).not.toHaveProperty("observationDate");
    expect(preserved.changes).not.toHaveProperty("observationTime");
  });

  it("selects the physical-damage category carried from the threat explorer", async () => {
    vi.mocked(getThreatCategories).mockResolvedValue([{
      threatCategoryId: 44,
      code: "physical_reef_damage",
      label: "Physical reef damage",
      shortExplanation: "Recently damaged coral.",
      usefulEvidence: "A close and wider photograph.",
      safetyReminder: "Observe safely.",
      iconReference: null,
    }]);

    render(<ObservationForm initialThreat="physical_reef_damage" />);
    await act(async () => { await Promise.resolve(); });

    expect(updateReportDraft).toHaveBeenCalledWith({
      threatCategoryCode: "physical_reef_damage",
      threatCategoryId: 44,
    });
  });

  it("waits for the account draft before restoring photo metadata", async () => {
    runtime.draftRestored = false;
    const view = render(<ObservationForm />);
    await act(async () => { await Promise.resolve(); });
    expect(loadDraftPhotos).not.toHaveBeenCalled();

    runtime.draftRestored = true;
    view.rerender(<ObservationForm />);
    await act(async () => { await Promise.resolve(); });
    expect(loadDraftPhotos).toHaveBeenCalledTimes(1);
  });
});
