import { beforeEach, describe, expect, it } from "vitest";
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
});

describe("Epic 3 Reef Threat Explorer", () => {
  it("introduces all four supported threats without requiring input", () => {
    renderExplorer();

    expect(screen.getByRole("heading", { name: /meet the four threats/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^explore /i })).toHaveLength(4);
    expect(screen.getByText(/lost or abandoned nets/i)).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });
});
