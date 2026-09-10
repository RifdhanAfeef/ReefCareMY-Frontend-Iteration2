import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationFlow } from "../location-flow";
import { getDiveSessions } from "@/lib/api/diveSessionsApi";
import { getDiveSites } from "@/lib/api/referenceApi";

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
  pin: null;
  locationSource: "dive_site";
  confidence: "";
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

beforeEach(() => {
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
