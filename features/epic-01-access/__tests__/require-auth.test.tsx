import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../auth-context";
import { RequireAuth, RequireRole } from "../require-auth";

let mockPathname = "/my-reports";
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  replace.mockClear();
  window.localStorage.clear();
});

describe("US1.1 — role-based route separation", () => {
  it("redirects an observer away from the coordinator workspace", async () => {
    mockPathname = "/coordinator/report-queue";
    window.localStorage.setItem(
      "reefcare.auth",
      JSON.stringify({
        user: { id: 1, displayName: "Sam", role: "observer" },
        accessToken: "token",
      }),
    );

    render(
      <AuthProvider>
        <RequireRole role="case_coordinator">
          <p>Coordinator queue</p>
        </RequireRole>
      </AuthProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-reports"));
    expect(screen.queryByText("Coordinator queue")).not.toBeInTheDocument();
  });

  it("allows a coordinator into the coordinator workspace", async () => {
    mockPathname = "/coordinator/report-queue";
    window.localStorage.setItem(
      "reefcare.auth",
      JSON.stringify({
        user: { id: 2, displayName: "Casey", role: "case_coordinator" },
        accessToken: "token",
      }),
    );

    render(
      <AuthProvider>
        <RequireRole role="case_coordinator">
          <p>Coordinator queue</p>
        </RequireRole>
      </AuthProvider>,
    );

    expect(await screen.findByText("Coordinator queue")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("US1.5 AC1 — authentication required to submit a report", () => {
  it("redirects an unauthenticated visitor away from the report-a-reef route", async () => {
    mockPathname = "/report-a-reef";

    render(
      <AuthProvider>
        <RequireAuth>
          <p>Report form</p>
        </RequireAuth>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?next=%2Freport-a-reef");
    });
    expect(screen.queryByText("Report form")).not.toBeInTheDocument();
  });
});

describe("US1.5 AC2 — authentication required for My Reports", () => {
  it("redirects an unauthenticated visitor away from my-reports", async () => {
    mockPathname = "/my-reports";

    render(
      <AuthProvider>
        <RequireAuth>
          <p>My reports content</p>
        </RequireAuth>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fmy-reports");
    });
    expect(screen.queryByText("My reports content")).not.toBeInTheDocument();
  });

  it("does not redirect a visitor who is already signed in", async () => {
    window.localStorage.setItem(
      "reefcare.auth",
      JSON.stringify({
        user: { id: 1, displayName: "Sam", role: "observer" },
        accessToken: "token",
      }),
    );

    render(
      <AuthProvider>
        <RequireAuth>
          <p>My reports content</p>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText("My reports content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
