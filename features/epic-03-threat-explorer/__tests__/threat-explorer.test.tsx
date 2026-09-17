import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/features/epic-01-access/auth-context";
import { ThreatExplorer } from "../threat-explorer";

function renderExplorer() {
  return render(
    <AuthProvider>
      <ThreatExplorer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Epic 3 Reef Threat Explorer", () => {
  it("introduces all four supported threats without requiring input", () => {
    renderExplorer();

    expect(screen.getByRole("heading", { name: /explore a threat/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^explore /i })).toHaveLength(4);
    expect(screen.getByText(/lost or abandoned nets/i)).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });

  it("moves between threats with card and carousel controls", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: "Explore Coral bleaching" }));
    expect(screen.getByRole("heading", { name: "Coral bleaching" })).toBeInTheDocument();
    expect(screen.getByText("2 of 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next threat" }));
    expect(screen.getByRole("heading", { name: "Marine debris" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous threat" }));
    expect(screen.getByRole("heading", { name: "Coral bleaching" })).toBeInTheDocument();
  });

  it("opens a threat selected by a Reef Threats link", () => {
    render(
      <AuthProvider>
        <ThreatExplorer initialThreat="marine_debris" />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: "Marine debris" })).toBeInTheDocument();
    expect(screen.getByText("3 of 4")).toBeInTheDocument();
  });

  it("updates the selected threat details after choosing a card", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: "Explore Coral bleaching" }));

    expect(screen.getByRole("region", { name: "Coral bleaching" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore Coral bleaching" })).toHaveAttribute("aria-pressed", "true");
  });

  it("teaches recognition through tap-only Spot the Threat feedback", async () => {
    const user = userEvent.setup();
    renderExplorer();

    expect(screen.getByRole("heading", { name: "Spot the threat" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ghost fishing gear" }));

    expect(screen.getByRole("status")).toHaveTextContent(/mesh/i);

    await user.click(screen.getByRole("button", { name: "Coral bleaching" }));
    expect(screen.getByRole("status")).toHaveTextContent(/notice the colour/i);
    expect(screen.getByRole("status")).toHaveTextContent(/intact branching shape/i);
  });

  it("routes a public visitor through login while preserving the selected threat", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: "Explore Physical reef damage" }));
    expect(await screen.findByRole("link", { name: "Report this threat" })).toHaveAttribute(
      "href",
      "/login?next=%2Freport-a-reef%3Fthreat%3Dphysical_damage",
    );
    expect(screen.getByRole("link", { name: "I’m not sure what I saw" })).toHaveAttribute(
      "href",
      "/login?next=%2Freport-a-reef%3Fthreat%3Dunsure",
    );
  });
});
