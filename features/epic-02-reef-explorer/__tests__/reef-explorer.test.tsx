import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReefExplorer } from "../reef-explorer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () => ({ onSelectSite }: { onSelectSite: (siteId: string) => void }) => (
    <button type="button" onClick={() => onSelectSite("tioman-tiger-reef")}>Map marker Tiger Reef</button>
  ),
}));

vi.mock("@/features/epic-01-access/auth-context", () => ({
  useAuth: () => ({ status: "anonymous", user: null }),
}));

describe("Epic 2 Reef Explorer", () => {
  it("is publicly readable and keeps the detail panel in the same side-panel region", async () => {
    const user = userEvent.setup();
    render(<ReefExplorer />);

    expect(screen.getByRole("heading", { name: "Explore Malaysia's reef areas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose an island or dive site" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /D'Lagoon/i }));

    expect(screen.getByRole("heading", { name: "D'Lagoon" })).toBeInTheDocument();
    expect(screen.getByText(/General area only/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Experience suitability" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tourism Malaysia/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Dive conditions reminder")).toHaveTextContent(
      "Conditions and requirements can change. Confirm them with a licensed operator and the relevant authority.",
    );
    expect(screen.queryByText(/does not provide individual dive clearance/i)).not.toBeInTheDocument();

    expect(screen.getByText("Image 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show next site image" }));
    expect(screen.getByText("Image 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enlarge image 2 of D'Lagoon" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show previous site image" }));

    await user.click(screen.getByRole("button", { name: "Enlarge image 1 of D'Lagoon" }));
    expect(screen.getByRole("dialog", { name: "D'Lagoon enlarged image" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close enlarged image" }));
    expect(screen.queryByRole("dialog", { name: "D'Lagoon enlarged image" })).not.toBeInTheDocument();
  });

  it("explains authentication before an anonymous visitor enters reporting", async () => {
    const user = userEvent.setup();
    render(<ReefExplorer />);

    await user.click(screen.getByRole("button", { name: /D'Lagoon/i }));
    await user.click(screen.getByRole("button", { name: "Report a Reef Threat" }));

    expect(screen.getByRole("dialog", { name: "Sign in to report this reef threat" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Freport-a-reef");
    expect(screen.getByRole("link", { name: "Create Observer account" })).toHaveAttribute("href", "/register?next=%2Freport-a-reef");
    expect(screen.getByText(/track it, respond to information requests/i)).toBeInTheDocument();
  });

  it("shows an honest no-activity state", async () => {
    const user = userEvent.setup();
    render(<ReefExplorer />);

    await user.click(screen.getByRole("button", { name: /Sail Rock/i }));

    expect(screen.getByText("No public ReefCare activity is currently available")).toBeInTheDocument();
    expect(screen.getByText(/Only approved, privacy-safe updates appear here/i)).toBeInTheDocument();
  });
});
