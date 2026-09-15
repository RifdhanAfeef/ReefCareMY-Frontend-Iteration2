import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationFlow } from "../location-flow";
import { getDiveSessions } from "@/lib/api/diveSessionsApi";
import { getDiveSites } from "@/lib/api/referenceApi";
import { checkReportLocation } from "@/lib/api/reportsApi";
import { selectedReefSiteStorageKey } from "@/features/epic-02-reef-explorer/selected-site-storage";

type TestSession = {
  id: string;
  backendId: number | null;
  namedDiveSiteId: number;
  site: string;
  label?: string;
  date?: string;
  start?: string;
  end?: string;
};

type TestLocationDraft = {
  step: "session" | "create" | "location" | "confirm" | "privacy" | "saved";
  sessions: TestSession[];
  selectedSessionId: string;
  form: { site: string; label: string; date: string; start: string; end: string };
  pin: { x: number; y: number; latitude: number; longitude: number } | null;
  locationSource: "dive_site" | "map_pin" | "manual_coordinates";
  confidence: "" | "exact" | "within_100m" | "within_1km" | "dive_site_only" | "unsure";
};

const appState = vi.hoisted(() => ({
  updateLocationDraft: vi.fn(),
  locationDraft: {
    step: "session",
    sessions: [],
    selectedSessionId: "",
    form: { site: "", label: "", date: "", start: "", end: "" },
    pin: null,
    locationSource: "dive_site",
    confidence: "",
  },
})) as { updateLocationDraft: ReturnType<typeof vi.fn>; locationDraft: TestLocationDraft };

vi.mock("@/features/shared/mock-app-state", () => ({
  useMockAppState: () => appState,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="map-placeholder" />,
}));
vi.mock("@/lib/api/diveSessionsApi");
vi.mock("@/lib/api/referenceApi");
vi.mock("@/lib/api/reportsApi");

beforeEach(() => {
  window.localStorage.clear();
  appState.updateLocationDraft.mockReset();
  Object.assign(appState.locationDraft, {
    step: "session",
    sessions: [],
    selectedSessionId: "",
    form: { site: "", label: "", date: "", start: "", end: "" },
    pin: null,
    locationSource: "dive_site",
    confidence: "",
  });
  vi.mocked(getDiveSites).mockResolvedValue([
    { diveSiteId: 1, name: "Batu Nisan", publicAreaLabel: "Perhentian Islands" },
  ]);
  vi.mocked(getDiveSessions).mockResolvedValue([]);
  vi.mocked(checkReportLocation).mockResolvedValue({
    checkAvailable: true,
    hasWarning: false,
    warningCode: null,
    message: null,
    distanceMetres: 100,
    thresholdMetres: 5000,
    selectedSiteId: 1,
    selectedSiteName: "Batu Nisan",
  });
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("Finding 4 — no-session journey", () => {
  it("shows one clear create-session action when no Dive Sessions exist", async () => {
    const user = userEvent.setup();
    render(<LocationFlow />);

    expect(await screen.findByRole("heading", { name: "Create your first Dive Session" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use selected session" })).not.toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: "Create Dive Session" });
    expect(createButton).toBeEnabled();
    await user.click(createButton);

    expect(appState.updateLocationDraft).toHaveBeenCalledWith({ step: "create" });
  });

  it("marks Dive Session as the current location-flow step", async () => {
    render(<LocationFlow />);
    await screen.findByRole("heading", { name: "Create your first Dive Session" });

    await waitFor(() => {
      expect(screen.getByText("Dive Session").closest("li")).toHaveAttribute("aria-current", "step");
    });
  });

  it("shows the adaptive empty state instead of an error-like recovery page after refresh", async () => {
    appState.locationDraft.step = "location";

    render(<LocationFlow />);

    expect(await screen.findByRole("heading", { name: "Create your first Dive Session" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a Dive Session first" })).not.toBeInTheDocument();
  });

  it("displays the selected general dive site as read-only text rather than a dropdown", async () => {
    const selectedSession = {
      id: "backend-session-7",
      backendId: 7,
      namedDiveSiteId: 1,
      site: "Batu Nisan — Perhentian Islands",
      date: "05/09/2026",
    };
    appState.locationDraft.step = "location";
    appState.locationDraft.sessions = [selectedSession];
    appState.locationDraft.selectedSessionId = selectedSession.id;
    vi.mocked(getDiveSessions).mockResolvedValue([{
      diveSessionId: 7,
      label: null,
      diveDate: "2026-09-05",
      namedDiveSite: { diveSiteId: 1, name: "Batu Nisan", publicAreaLabel: "Perhentian Islands" },
      approximateStartTime: null,
      approximateEndTime: null,
    }]);

    render(<LocationFlow />);

    expect(await screen.findByRole("heading", { name: "Where on the reef did you observe it?" })).toBeInTheDocument();
    expect(screen.getByText("Batu Nisan — Perhentian Islands")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Named dive site/i })).not.toBeInTheDocument();
  });
});

describe("Epic 2 report CTA handoff", () => {
  it("opens session creation with the selected dive site prefilled when no matching session exists", async () => {
    window.localStorage.setItem(selectedReefSiteStorageKey, JSON.stringify({
      id: "perhentian-d-lagoon",
      backendDiveSiteId: 19,
      name: "D'Lagoon",
      publicAreaLabel: "Perhentian Islands",
    }));
    vi.mocked(getDiveSites).mockResolvedValue([
      { diveSiteId: 19, name: "D'Lagoon", publicAreaLabel: "Perhentian Islands" },
    ]);

    render(<LocationFlow />);

    await waitFor(() => expect(appState.updateLocationDraft).toHaveBeenCalledWith(expect.objectContaining({
      form: expect.objectContaining({ site: "19" }),
      step: "create",
    })));
    expect(window.localStorage.getItem(selectedReefSiteStorageKey)).toBeNull();
  });

  it("opens session creation even when an existing session matches the selected dive site", async () => {
    window.localStorage.setItem(selectedReefSiteStorageKey, JSON.stringify({
      id: "perhentian-d-lagoon",
      backendDiveSiteId: 19,
      name: "D'Lagoon",
      publicAreaLabel: "Perhentian Islands",
    }));
    vi.mocked(getDiveSites).mockResolvedValue([
      { diveSiteId: 19, name: "D'Lagoon", publicAreaLabel: "Perhentian Islands" },
      { diveSiteId: 17, name: "Batu Nisan", publicAreaLabel: "Perhentian Islands" },
    ]);
    vi.mocked(getDiveSessions).mockResolvedValue([
      { diveSessionId: 4, label: null, diveDate: "2026-09-02", namedDiveSite: { diveSiteId: 17, name: "Batu Nisan", publicAreaLabel: "Perhentian Islands" }, approximateStartTime: null, approximateEndTime: null },
      { diveSessionId: 9, label: "Dive 1", diveDate: "2026-09-12", namedDiveSite: { diveSiteId: 19, name: "D'Lagoon", publicAreaLabel: "Perhentian Islands" }, approximateStartTime: null, approximateEndTime: null },
    ]);

    render(<LocationFlow />);

    await waitFor(() => expect(appState.updateLocationDraft).toHaveBeenCalledWith(expect.objectContaining({
      form: expect.objectContaining({ site: "19" }),
      selectedSessionId: "backend-session-4",
      step: "create",
    })));
  });
});

describe("Location validation", () => {
  const selectedSession = {
    id: "backend-session-7",
    backendId: 7,
    namedDiveSiteId: 1,
    site: "Batu Nisan — Perhentian Islands",
    date: "05/09/2026",
  };

  beforeEach(() => {
    appState.locationDraft.step = "location";
    appState.locationDraft.sessions = [selectedSession];
    appState.locationDraft.selectedSessionId = selectedSession.id;
    vi.mocked(getDiveSessions).mockResolvedValue([{
      diveSessionId: 7,
      label: null,
      diveDate: "2026-09-05",
      namedDiveSite: { diveSiteId: 1, name: "Batu Nisan", publicAreaLabel: "Perhentian Islands" },
      approximateStartTime: null,
      approximateEndTime: null,
    }]);
  });

  it("blocks a map pin outside the supported Malaysia area on the Location step", async () => {
    appState.locationDraft.pin = { x: 50, y: 50, latitude: 10.06723, longitude: 108.56992 };
    render(<LocationFlow />);
    await screen.findByRole("heading", { name: "Where on the reef did you observe it?" });
    appState.updateLocationDraft.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Confirm map pin" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/within Malaysia/i);
    expect(checkReportLocation).not.toHaveBeenCalled();
    expect(appState.updateLocationDraft).not.toHaveBeenCalledWith(expect.objectContaining({ step: "confirm" }));
  });

  it("shows a backend distance warning on the Location step and prevents continuing", async () => {
    appState.locationDraft.pin = { x: 50, y: 50, latitude: 5.8, longitude: 116.0 };
    vi.mocked(checkReportLocation).mockResolvedValue({
      checkAvailable: true,
      hasWarning: true,
      warningCode: "far_from_dive_site",
      message: "The supplied location appears far from the selected dive site.",
      distanceMetres: 400000,
      thresholdMetres: 5000,
      selectedSiteId: 1,
      selectedSiteName: "Batu Nisan",
    });
    render(<LocationFlow />);
    await screen.findByRole("heading", { name: "Where on the reef did you observe it?" });
    appState.updateLocationDraft.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Confirm map pin" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/far from the selected dive site/i);
    expect(appState.updateLocationDraft).not.toHaveBeenCalledWith(expect.objectContaining({ step: "confirm" }));
  });
});
